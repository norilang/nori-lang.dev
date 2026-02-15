---
title: Compilation
description: How Nori constructs compile to Udon Assembly — variables, events, functions, expressions.
sidebar:
  order: 3
---

This page describes how each Nori language construct is translated into Udon Assembly. Understanding this mapping is useful for debugging, performance tuning, and knowing what the compiler is actually doing with your code.

## Pipeline overview

The Nori compiler has five stages. Each stage takes the output of the previous one and produces a more concrete representation:

1. **Lexer** -- Reads the source text character by character and produces a flat stream of tokens (keywords, identifiers, literals, operators, punctuation).
2. **Parser** -- Consumes the token stream and builds an Abstract Syntax Tree (AST) -- a tree structure representing the syntactic structure of the program.
3. **Semantic Analyzer** -- Walks the AST to resolve types, validate names, check for errors, and annotate nodes with Udon type information. This is where type mismatches, undefined variables, and recursion are detected.
4. **IR Lowering** -- Translates the annotated AST into a flat intermediate representation (IR) of Udon-level instructions. This stage allocates heap variables, generates temporaries, and linearizes control flow into labeled blocks with jumps.
5. **Udon Emitter** -- Serializes the IR into the final Udon Assembly text. This stage computes byte offsets for all labels and resolves jump addresses to concrete numbers.

```
  Source code (.nori)
        |
    [ Lexer ]          tokens
        |
    [ Parser ]          AST
        |
    [ Analyzer ]        annotated AST + diagnostics
        |
    [ IR Lowering ]     IrModule (blocks + heap vars)
        |
    [ Emitter ]         Udon Assembly text (.uasm)
```

## Variables

Every variable in Nori becomes a heap slot in the data section. There are no local variables in Udon -- the heap is the only storage.

### `let`

A `let` declaration creates a single heap entry with a name, type, and initial value:

```rust
let count: int = 0
```

```
count: %SystemInt32, 0
```

### `pub let`

Adding `pub` adds an `.export` directive, which makes the variable visible in the Unity Inspector:

```rust
pub let speed: float = 90.0
```

```
.export speed
speed: %SystemSingle, 90
```

### `sync`

A `sync` declaration adds a `.sync` directive with an interpolation mode:

```rust
sync none score: int = 0
```

```
.sync score, none
score: %SystemInt32, 0
```

### Local variables

Variables declared inside event handlers or functions are still module-level heap entries. Udon has no concept of scope at the assembly level:

```rust
on Update {
    let step: float = speed * Time.deltaTime
}
```

The variable `step` becomes a top-level heap entry just like any other variable:

```
step: %SystemSingle, null
```

Because `step` is computed at runtime, its initial value in the data section is `null`. The actual value is set every frame by a `COPY` instruction.

### Temporaries

The compiler generates temporary heap slots for every intermediate value in an expression. These are named `__tmp_N_Type`:

```rust
let result: int = a + b * c
```

This expression needs a temporary for the `b * c` sub-expression:

```
__tmp_0_SystemInt32: %SystemInt32, null    // holds b * c
__tmp_1_SystemInt32: %SystemInt32, null    // holds a + (b * c)
```

## Events

Events are exported labels in the code section. The VRChat runtime uses these labels as entry points -- when something happens in the world, VRChat jumps to the corresponding label.

### Name mapping

Nori event names map to Udon labels:

| Nori event          | Udon label             |
|---------------------|------------------------|
| `on Start`          | `_start`               |
| `on Update`         | `_update`              |
| `on LateUpdate`     | `_lateUpdate`          |
| `on FixedUpdate`    | `_fixedUpdate`         |
| `on Interact`       | `_interact`            |
| `on Enable`         | `_onEnable`            |
| `on Disable`        | `_onDisable`           |
| `on Pickup`         | `_onPickup`            |
| `on Drop`           | `_onDrop`              |
| `on PlayerJoined`   | `_onPlayerJoined`      |
| `on PlayerLeft`     | `_onPlayerLeft`        |
| `on TriggerEnter`   | `_onTriggerEnter`      |
| `on TriggerExit`    | `_onTriggerExit`       |
| `on CollisionEnter` | `_onCollisionEnter`    |
| `on VariableChange` | `_onDeserialization`   |
| `on PreSerialization`  | `_onPreSerialization` |
| `on PostSerialization` | `_onPostSerialization`|

### Halt sentinel

Every event handler ends with `JUMP, 0xFFFFFFFC`. This is the halt sentinel -- a special address that tells the VM the handler is finished and control should return to VRChat:

```rust
on Start {
    log("Hello!")
}
```

```
.export _start

_start:
    PUSH, __const_0_SystemString
    EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"
    JUMP, 0xFFFFFFFC
```

### Custom events

Custom events defined with the `event` keyword also become exported labels. They end with the same halt sentinel:

```rust
event AddPoint {
    score = score + 1
}
```

```
.export AddPoint

AddPoint:
    PUSH, score
    PUSH, __const_1_SystemInt32
    PUSH, __tmp_0_SystemInt32
    EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"
    PUSH, __tmp_0_SystemInt32
    PUSH, score
    COPY
    JUMP, 0xFFFFFFFC
```

## Functions

Udon has no call stack, no stack frames, and no `CALL` instruction. The Nori compiler simulates function calls using `JUMP` and `JUMP_INDIRECT` with return addresses stored in heap variables.

### Infrastructure

Each function gets three kinds of heap variables:

- **`__retaddr_funcName`** -- A `SystemUInt32` that stores the return address (the byte offset to jump back to after the function finishes).
- **`__param_funcName_paramName`** -- One slot per parameter, used to pass arguments into the function.
- **`__retval_funcName`** -- A slot for the return value (only if the function returns something).

### Call sequence

When a function is called, the compiler emits:

1. **Copy arguments** to the parameter slots (`__param_funcName_paramName`)
2. **Store the return address** in `__retaddr_funcName` (the byte offset of the instruction after the call)
3. **`JUMP`** to the function's label (`__fn_funcName`)

```rust
fn add(a: int, b: int): int {
    return a + b
}

on Start {
    let result: int = add(3, 5)
}
```

The call site in `_start` looks like:

```
# Copy arguments to parameter slots
PUSH, __const_3                        // literal 3
PUSH, __param_add_a
COPY
PUSH, __const_5                        // literal 5
PUSH, __param_add_b
COPY

# Store return address and jump
PUSH, __const_retaddr                  // byte offset of __ret_add_0
PUSH, __retaddr_add
COPY
JUMP, 0x________                       // jump to __fn_add
```

### Return sequence

At the end of the function body (or at a `return` statement), the compiler emits:

1. **Copy the result** to `__retval_funcName` (if returning a value)
2. **`JUMP_INDIRECT`** to the address stored in `__retaddr_funcName`

```
__fn_add:
    # Copy param slots to local names
    PUSH, __param_add_a
    PUSH, a
    COPY
    PUSH, __param_add_b
    PUSH, b
    COPY

    # Compute a + b
    PUSH, a
    PUSH, b
    PUSH, __tmp_0_SystemInt32
    EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"

    # Copy result to return slot
    PUSH, __tmp_0_SystemInt32
    PUSH, __retval_add
    COPY

    # Return to caller
    PUSH, __retaddr_add
    JUMP_INDIRECT, __retaddr_add
```

After the `JUMP_INDIRECT`, execution continues at the return label in the caller, which copies the return value out of `__retval_add`.

### Why recursion is impossible

The return address is stored in a single heap variable. If function `foo` calls itself, the second call overwrites `__retaddr_foo` with a new return address, destroying the original. When the inner call returns, it jumps to the correct place, but when the outer call tries to return, the address is gone. This is why the compiler detects and rejects recursion at compile time.

## Expressions

Every Nori expression compiles to a sequence of `PUSH`, `EXTERN`, and `COPY` instructions that operate on heap slots.

### Arithmetic

Binary operators compile to an extern call with the two operands and a result temp:

```rust
let x: int = a + b
```

```
PUSH, a
PUSH, b
PUSH, __tmp_0_SystemInt32
EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"
PUSH, __tmp_0_SystemInt32
PUSH, x
COPY
```

### Comparison

Comparisons work the same way but produce a `SystemBoolean` result:

```rust
if a > b { ... }
```

```
PUSH, a
PUSH, b
PUSH, __tmp_0_SystemBoolean
EXTERN, "SystemInt32.__op_GreaterThan__SystemInt32_SystemInt32__SystemBoolean"
PUSH, __tmp_0_SystemBoolean
JUMP_IF_FALSE, 0x________
```

### Member access (properties)

Reading a property compiles to a getter extern. For instance properties, the object is pushed first:

```rust
let pos: Vector3 = transform.position
```

```
PUSH, __this_UnityEngineTransform_0
PUSH, __tmp_0_UnityEngineVector3
EXTERN, "UnityEngineTransform.__get_position__UnityEngineVector3"
PUSH, __tmp_0_UnityEngineVector3
PUSH, pos
COPY
```

For static properties, there is no object push:

```rust
let dt: float = Time.deltaTime
```

```
PUSH, __tmp_0_SystemSingle
EXTERN, "UnityEngineTime.__get_deltaTime__SystemSingle"
PUSH, __tmp_0_SystemSingle
PUSH, dt
COPY
```

### Method calls

Instance method calls push the object, then the arguments, then the result slot (if non-void):

```rust
gameObject.SetActive(false)
```

```
PUSH, __this_UnityEngineGameObject_0
PUSH, __const_false
EXTERN, "UnityEngineGameObject.__SetActive__SystemBoolean__SystemVoid"
```

### String interpolation

String interpolation compiles to a chain of `ToString` and `Concat` extern calls:

```rust
log("Score: {score}")
```

Each `{expr}` is converted to a string via `SystemObject.__ToString__SystemString`, then concatenated with the surrounding literal parts via `SystemString.__Concat__SystemString_SystemString__SystemString`:

```
# "Score: " is a string constant
# {score} -> ToString
PUSH, score
PUSH, __tmp_0_SystemString
EXTERN, "SystemObject.__ToString__SystemString"

# Concatenate
PUSH, __const_prefix                     // "Score: "
PUSH, __tmp_0_SystemString
PUSH, __tmp_1_SystemString
EXTERN, "SystemString.__Concat__SystemString_SystemString__SystemString"

# Log the result
PUSH, __tmp_1_SystemString
EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"
```

### Boolean literals

Udon's data section cannot represent a boolean `true` value -- all boolean heap slots initialize to `null`, which the VM treats as `false`. The Nori compiler works around this by computing `true` at runtime using boolean negation:

```rust
let flag: bool = true
```

In the data section, the variable initializes to `null`:

```
flag: %SystemBoolean, null
```

At runtime, the compiler injects initialization code at the start of `_start` that negates `false` to produce `true`:

```
PUSH, __const_false                  // null (= false)
PUSH, __tmp_0_SystemBoolean
EXTERN, "SystemBoolean.__op_UnaryNegation__SystemBoolean__SystemBoolean"
PUSH, __tmp_0_SystemBoolean
PUSH, flag
COPY
```

### Compound assignment

Compound assignment operators (`+=`, `-=`, `*=`, `/=`) compile as a read-compute-write sequence:

```rust
count += 1
```

```
PUSH, count
PUSH, __const_1
PUSH, __tmp_0_SystemInt32
EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"
PUSH, __tmp_0_SystemInt32
PUSH, count
COPY
```

For compound assignment to properties (like `transform.position += offset`), the compiler emits a getter call, the computation, and then a setter call.

## Control flow

### if / else

An `if` statement compiles to a `JUMP_IF_FALSE` that skips past the then-body. If there is an `else` branch, an unconditional `JUMP` at the end of the then-body skips past the else-body:

```rust
if is_open {
    target_angle = 90.0
} else {
    target_angle = 0.0
}
```

```
    PUSH, is_open
    JUMP_IF_FALSE, 0x________        // jump to __else_0

    # then body
    PUSH, __const_90
    PUSH, target_angle
    COPY
    JUMP, 0x________                 // jump to __endif_1

__else_0:
    # else body
    PUSH, __const_0
    PUSH, target_angle
    COPY

__endif_1:
    # execution continues
```

### while

A `while` loop compiles to a condition check, a `JUMP_IF_FALSE` to the loop end, the body, and an unconditional `JUMP` back to the condition:

```rust
while count < 10 {
    count = count + 1
}
```

```
    JUMP, 0x________                 // jump to __while_cond_0

__while_cond_0:
    PUSH, count
    PUSH, __const_10
    PUSH, __tmp_0_SystemBoolean
    EXTERN, "SystemInt32.__op_LessThan__SystemInt32_SystemInt32__SystemBoolean"
    PUSH, __tmp_0_SystemBoolean
    JUMP_IF_FALSE, 0x________        // jump to __while_end_1

    # body
    PUSH, count
    PUSH, __const_1
    PUSH, __tmp_1_SystemInt32
    EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"
    PUSH, __tmp_1_SystemInt32
    PUSH, count
    COPY

    JUMP, 0x________                 // jump to __while_cond_0

__while_end_1:
```

### for..in range

A `for i in 0..10` loop compiles as a while loop with an explicit counter variable and an increment step at the bottom:

```rust
for i in 0..10 {
    log("{i}")
}
```

```
    # Initialize counter
    PUSH, __const_0
    PUSH, i
    COPY

    JUMP, 0x________                 // jump to __for_cond_0

__for_cond_0:
    # Check i < 10
    PUSH, i
    PUSH, __const_10
    PUSH, __tmp_0_SystemBoolean
    EXTERN, "SystemInt32.__op_LessThan__SystemInt32_SystemInt32__SystemBoolean"
    PUSH, __tmp_0_SystemBoolean
    JUMP_IF_FALSE, 0x________        // jump to __for_end_2

    # body
    ...

__for_incr_1:
    # i = i + 1
    PUSH, i
    PUSH, __const_1
    PUSH, __tmp_1_SystemInt32
    EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"
    PUSH, __tmp_1_SystemInt32
    PUSH, i
    COPY
    JUMP, 0x________                 // jump to __for_cond_0

__for_end_2:
```

### break and continue

`break` compiles to a `JUMP` to the loop's end label. `continue` compiles to a `JUMP` to the loop's condition label (or increment label in a `for` loop):

```rust
while true {
    if done {
        break       // JUMP to __while_end_N
    }
    continue        // JUMP to __while_cond_N
}
```

### return

In an event handler, `return` compiles to `JUMP, 0xFFFFFFFC` (the halt sentinel), ending the handler early. In a function, `return` copies the result to `__retval_funcName` and then executes `JUMP_INDIRECT` to the stored return address.
