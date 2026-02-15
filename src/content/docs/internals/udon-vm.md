---
title: The Udon VM
description: How VRChat's Udon Virtual Machine works — opcodes, heap memory, extern dispatch.
sidebar:
  order: 1
---

Udon is the virtual machine that runs inside every VRChat world. It is a stack-and-heap interpreter built on top of Unity, designed to sandbox user code so that it cannot access the filesystem, the network, or any other resource that VRChat has not explicitly whitelisted. Every Nori program compiles down to Udon Assembly, which the VM executes at runtime.

Udon has no built-in arithmetic, no string operations, and no way to call Unity APIs directly. All useful computation happens through a single opcode -- `EXTERN` -- which dispatches to a whitelisted .NET method. The rest of the instruction set exists to move data around and control execution flow.

## Memory model

Udon's memory is split into two structures: a **heap** and an **integer stack**.

### Heap

The heap is a flat array of typed values. Every variable in a Nori program -- whether it is a user-declared variable, a compiler-generated temporary, or a constant -- occupies one slot in this array. Each slot has a name, a type, and an initial value.

```
// Heap layout (conceptual)
index 0: speed        %SystemSingle   90.0
index 1: is_open      %SystemBoolean  null
index 2: __tmp_0      %SystemSingle   null
index 3: __const_0    %SystemString   "Hello"
```

There are no local variables, no registers, and no stack frames. A variable declared inside a function body lives in the same flat heap as a variable declared at the top level of the file. The heap is the only place data can exist.

### Integer stack

The integer stack holds **heap addresses**, not values. When an instruction needs to read or write a heap slot, the address of that slot is pushed onto the stack first. The instruction then pops the address and uses it to look up the actual value in the heap.

This means the typical pattern for any operation is:

1. `PUSH` the heap address of input A
2. `PUSH` the heap address of input B
3. `PUSH` the heap address of the output slot
4. `EXTERN` to call a method that reads from A and B, writes the result to the output slot

For example, adding two integers:

```
PUSH, a            // push address of heap slot 'a'
PUSH, b            // push address of heap slot 'b'
PUSH, __tmp_0      // push address of result slot
EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"
```

After execution, the value at `__tmp_0` in the heap contains the sum of `a` and `b`.

## Opcode table

Udon defines 9 opcodes. Opcode 3 is unused.

| Opcode | Name             | Size   | Description                                                                                              |
|--------|------------------|--------|----------------------------------------------------------------------------------------------------------|
| 0      | `NOP`            | 4 bytes  | No operation. Advances the program counter by 4 bytes.                                                 |
| 1      | `PUSH`           | 8 bytes  | Push a uint32 heap address onto the integer stack. The 4-byte operand is the heap address.             |
| 2      | `POP`            | 4 bytes  | Pop and discard the top value from the integer stack.                                                  |
| 4      | `JUMP_IF_FALSE`  | 8 bytes  | Pop a heap address from the stack. Read the boolean at that address. If false, jump to the 4-byte target address. Otherwise, continue to the next instruction. |
| 5      | `JUMP`           | 8 bytes  | Unconditional jump to the 4-byte target address. The special address `0xFFFFFFFC` is the halt sentinel -- it tells the VM that the current event handler is done. |
| 6      | `EXTERN`         | 8 bytes  | Call a whitelisted .NET method. The 4-byte operand is a reference to the method signature string. Arguments and return values are passed via heap addresses previously pushed onto the stack. |
| 7      | `ANNOTATION`     | 8 bytes  | A long no-op used for debugging metadata. The VM ignores it entirely.                                  |
| 8      | `JUMP_INDIRECT`  | 8 bytes  | Jump to the address stored at the heap index given by the 4-byte operand. Used for function returns.   |
| 9      | `COPY`           | 4 bytes  | Pop two heap addresses from the stack. Copy the value at the first address to the second address.      |

:::note
The Nori compiler's emitter counts `COPY` as 20 bytes because it emits the full `PUSH + PUSH + COPY` sequence as a single IR instruction. Similarly, `JUMP_IF_FALSE` counts as 16 bytes (`PUSH + JUMP_IF_FALSE`) and `JUMP_INDIRECT` counts as 16 bytes (`PUSH + JUMP_INDIRECT`). These are IR-level sizes, not raw opcode sizes.
:::

## Extern system

The `EXTERN` opcode is how Udon does everything: arithmetic, string manipulation, Unity API calls, VRChat SDK calls. Each extern is a whitelisted .NET method identified by a signature string.

### Signature format

```
TypeName.__MethodName__ParamType1_ParamType2__ReturnType
```

The format has four parts:

1. **TypeName** -- The .NET type that owns the method, with dots removed. `System.Int32` becomes `SystemInt32`, `UnityEngine.GameObject` becomes `UnityEngineGameObject`.
2. **MethodName** -- The method name, prefixed with double underscores. Properties become `__get_PropertyName` or `__set_PropertyName`. Operators become `__op_Addition`, `__op_Equality`, etc.
3. **Parameter types** -- Parameter types separated by single underscores, enclosed in double underscores on each side. Array types get an `Array` suffix: `System.Int32[]` becomes `SystemInt32Array`.
4. **Return type** -- The return type after the final double underscore. Void methods use `SystemVoid`.

### Examples

| Nori code             | Extern signature                                                                  |
|-----------------------|-----------------------------------------------------------------------------------|
| `a + b` (int)         | `SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32`                  |
| `a == b` (string)     | `SystemString.__op_Equality__SystemString_SystemString__SystemBoolean`            |
| `log("hi")`          | `UnityEngineDebug.__Log__SystemObject__SystemVoid`                                |
| `transform.position`  | `UnityEngineTransform.__get_position__UnityEngineVector3`                         |
| `obj.SetActive(true)` | `UnityEngineGameObject.__SetActive__SystemBoolean__SystemVoid`                    |

### Instance methods

For instance methods, the object that owns the method (the `this` reference) is pushed onto the stack **before** the arguments. The extern signature does not include the `this` type in its parameter list -- it is implicit.

```
// Nori: gameObject.SetActive(true)
PUSH, __this_UnityEngineGameObject_0    // push 'this' (the GameObject)
PUSH, __const_true                       // push the boolean argument
EXTERN, "UnityEngineGameObject.__SetActive__SystemBoolean__SystemVoid"
```

### Static methods

Static methods have no `this` reference. Only the arguments and return slot are pushed.

```
// Nori: Networking.IsOwner(localPlayer, gameObject)
PUSH, __tmp_localPlayer                  // first argument
PUSH, __this_UnityEngineGameObject_0     // second argument
PUSH, __tmp_result                       // result slot
EXTERN, "VRCSDKBaseVRCNetworking.__IsOwner__VRCSDKBaseVRCPlayerApi_UnityEngineGameObject__SystemBoolean"
```

## Execution model

Udon programs do not have a `main()` function or an initialization entry point. Instead, the VRChat runtime calls into the program through **events**.

Events are exported labels in the code section. When a player clicks an object, VRChat jumps to the `_interact` label. When the world loads, it jumps to `_start`. When a new frame begins, it jumps to `_update`. Each event handler runs until it hits a `JUMP, 0xFFFFFFFC` instruction -- the halt sentinel -- which tells the VM that the handler is done and control should return to VRChat.

Between events, the program does nothing. There is no background thread, no main loop, and no way for the program to run code outside of an event handler. The VRChat runtime owns the execution lifecycle entirely.

```
// A complete Udon program with two event handlers
.code_start

    .export _start
    .export _interact

    _start:
        PUSH, __const_str_0
        EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"
        JUMP, 0xFFFFFFFC       // halt — _start is done

    _interact:
        PUSH, __const_str_1
        EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"
        JUMP, 0xFFFFFFFC       // halt — _interact is done

.code_end
```

The VM jumps to `_start` when the world loads and to `_interact` when the player clicks the object. Each handler ends with the halt sentinel, returning control to VRChat.
