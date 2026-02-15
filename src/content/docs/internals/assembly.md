---
title: Assembly Format
description: Annotated walkthrough of Udon Assembly output from the Nori compiler.
sidebar:
  order: 2
---

The Nori compiler outputs Udon Assembly -- a text format that VRChat loads into the Udon VM at runtime. Every `.nori` file produces a single `.uasm` output file containing two sections: a data section that declares all heap variables, and a code section that contains the instructions.

## Structure

Every Udon Assembly file follows the same structure:

```
.data_start
    // Variable exports, sync directives, and heap declarations
.data_end

.code_start
    // Code exports, labels, and instructions
.code_end
```

The data section comes first and declares every heap variable the program uses. The code section follows and contains the actual instructions that the VM executes.

## Data section

The data section declares all variables that exist in the heap. This includes user-declared variables, compiler-generated temporaries, and constants.

### Variable declarations

Each variable declaration has a name, a type (prefixed with `%`), and an initial value:

```
.data_start

    speed: %SystemSingle, 90
    is_open: %SystemBoolean, null
    current_angle: %SystemSingle, 0
    __const_0_SystemString: %SystemString, "Hello from Nori!"
    __tmp_0_SystemSingle: %SystemSingle, null

.data_end
```

- **User variables** keep their original names: `speed`, `is_open`, `current_angle`.
- **Constants** are prefixed with `__const_` followed by a counter and type: `__const_0_SystemString`.
- **Temporaries** are prefixed with `__tmp_` followed by a counter and type: `__tmp_0_SystemSingle`. These hold intermediate results of expressions.
- **Function infrastructure** variables are prefixed with `__retaddr_`, `__param_`, or `__retval_`.

Types use the Udon naming convention: dots removed from the .NET namespace. `System.String` becomes `SystemString`, `UnityEngine.Vector3` becomes `UnityEngineVector3`.

### Export directive

The `.export` directive marks a variable as visible to the Unity Inspector. In Nori, `pub let` produces an export:

```rust
pub let speed: float = 90.0
```

```
.data_start

    .export speed
    speed: %SystemSingle, 90

.data_end
```

### Sync directive

The `.sync` directive marks a variable as networked. In Nori, the `sync` keyword produces a sync directive with an interpolation mode:

```rust
sync none score: int = 0
sync linear position: float = 0.0
sync smooth rotation: float = 0.0
```

```
.data_start

    .sync score, none
    .sync position, linear
    .sync rotation, smooth

    score: %SystemInt32, 0
    position: %SystemSingle, 0
    rotation: %SystemSingle, 0

.data_end
```

### Compiler-generated variables

The compiler generates several kinds of hidden variables:

- **`__this_*`** -- References to the current UdonBehaviour, its GameObject, and its Transform. These are initialized to `this` rather than `null`.
- **`__const_*`** -- Deduplicated constants. If you use the string `"Hello"` three times, only one `__const_N_SystemString` is created.
- **`__tmp_*`** -- Temporaries for expression results. Each sub-expression gets its own temp slot.
- **`__retaddr_funcName`** -- Stores the return address for a function call.
- **`__param_funcName_paramName`** -- Parameter passing slots for function calls.
- **`__retval_funcName`** -- Return value slot for functions that return a value.

## Code section

The code section contains labels and instructions. Labels are either exported (visible to VRChat as event entry points) or internal (used for jumps within the program).

### Exports

The `.export` directive in the code section marks a label as an event entry point. VRChat uses these to know where to jump when an event fires:

```
.code_start

    .export _start
    .export _interact

.code_end
```

### Instructions

Instructions are indented under their label. Each instruction is a comma-separated pair of opcode and operand:

```
.code_start

    .export _start

    _start:
        PUSH, __const_0_SystemString
        EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"
        JUMP, 0xFFFFFFFC

.code_end
```

## Hello World walkthrough

Here is the complete assembly output for the simplest Nori program:

```rust
on Start {
    log("Hello from Nori!")
}
```

Compiles to:

```
.data_start

    __this_VRCUdonCommonInterfacesIUdonEventReceiver_0: %VRCUdonCommonInterfacesIUdonEventReceiver, this
    __this_UnityEngineGameObject_0: %UnityEngineGameObject, this
    __this_UnityEngineTransform_0: %UnityEngineTransform, this
    __const_0_SystemString: %SystemString, "Hello from Nori!"

.data_end

.code_start

    .export _start

    _start:
        PUSH, __const_0_SystemString
        EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"
        JUMP, 0xFFFFFFFC

.code_end
```

Walking through the instructions:

1. **`PUSH, __const_0_SystemString`** -- Push the heap address of the string constant `"Hello from Nori!"` onto the integer stack.
2. **`EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"`** -- Call `Debug.Log`. The extern pops one address from the stack (the message argument) and calls the method.
3. **`JUMP, 0xFFFFFFFC`** -- Halt sentinel. Tells the VM the `_start` event handler is done.

## Full example: toggle door

Here is a larger example showing variables, control flow, arithmetic, and the Update event:

```rust
pub let speed: float = 90.0
let is_open: bool = false
let target_angle: float = 0.0
let current_angle: float = 0.0

on Interact {
    is_open = !is_open
    if is_open {
        target_angle = 90.0
    } else {
        target_angle = 0.0
    }
}

on Update {
    if current_angle != target_angle {
        let step: float = speed * Time.deltaTime
        current_angle = current_angle + step
    }
}
```

The data section declares every variable and constant the program uses:

```
.data_start

    .export speed

    speed: %SystemSingle, 90
    is_open: %SystemBoolean, null
    target_angle: %SystemSingle, 0
    current_angle: %SystemSingle, 0
    __this_VRCUdonCommonInterfacesIUdonEventReceiver_0: %VRCUdonCommonInterfacesIUdonEventReceiver, this
    __this_UnityEngineGameObject_0: %UnityEngineGameObject, this
    __this_UnityEngineTransform_0: %UnityEngineTransform, this
    __const_0_SystemBoolean: %SystemBoolean, null
    __const_1_SystemSingle: %SystemSingle, 90
    __const_2_SystemSingle: %SystemSingle, 0
    __tmp_0_SystemBoolean: %SystemBoolean, null
    __tmp_1_SystemBoolean: %SystemBoolean, null
    __tmp_2_SystemSingle: %SystemSingle, null
    __tmp_3_SystemSingle: %SystemSingle, null
    __tmp_4_SystemSingle: %SystemSingle, null
    step: %SystemSingle, null

.data_end
```

Note that `is_open` has initial value `null`, not `false` -- Udon's data section cannot represent boolean `true`, so all booleans initialize to `null` (which the VM treats as `false`). If a boolean defaults to `true`, the compiler injects runtime initialization code at the start of `_start`.

The code section contains the two event handlers:

```
.code_start

    .export _interact
    .export _update

    _interact:
        # is_open = !is_open
        PUSH, is_open
        PUSH, __tmp_0_SystemBoolean
        EXTERN, "SystemBoolean.__op_UnaryNegation__SystemBoolean__SystemBoolean"
        PUSH, __tmp_0_SystemBoolean
        PUSH, is_open
        COPY

        # if is_open
        PUSH, is_open
        JUMP_IF_FALSE, 0x________    // jump to else label

        # target_angle = 90.0
        PUSH, __const_1_SystemSingle
        PUSH, target_angle
        COPY
        JUMP, 0x________             // jump past else

    __else_0:
        # target_angle = 0.0
        PUSH, __const_2_SystemSingle
        PUSH, target_angle
        COPY

    __endif_1:
        JUMP, 0xFFFFFFFC             // halt

    _update:
        # if current_angle != target_angle
        PUSH, current_angle
        PUSH, target_angle
        PUSH, __tmp_1_SystemBoolean
        EXTERN, "SystemSingle.__op_Inequality__SystemSingle_SystemSingle__SystemBoolean"
        PUSH, __tmp_1_SystemBoolean
        JUMP_IF_FALSE, 0x________    // jump to endif

        # let step = speed * Time.deltaTime
        PUSH, __tmp_2_SystemSingle
        EXTERN, "UnityEngineTime.__get_deltaTime__SystemSingle"
        PUSH, speed
        PUSH, __tmp_2_SystemSingle
        PUSH, __tmp_3_SystemSingle
        EXTERN, "SystemSingle.__op_Multiply__SystemSingle_SystemSingle__SystemSingle"
        PUSH, __tmp_3_SystemSingle
        PUSH, step
        COPY

        # current_angle = current_angle + step
        PUSH, current_angle
        PUSH, step
        PUSH, __tmp_4_SystemSingle
        EXTERN, "SystemSingle.__op_Addition__SystemSingle_SystemSingle__SystemSingle"
        PUSH, __tmp_4_SystemSingle
        PUSH, current_angle
        COPY

    __endif_2:
        JUMP, 0xFFFFFFFC             // halt

.code_end
```

The addresses shown as `0x________` are placeholders for readability. In the actual output, the compiler resolves all labels to concrete byte offsets during the emit pass.

## Reading assembly output

A few tips for navigating compiled output:

- **Follow the PUSHes.** Before every `EXTERN` or `COPY`, the preceding `PUSH` instructions tell you exactly which heap slots are being read from and written to. The last `PUSH` before an `EXTERN` is typically the result slot.
- **Match externs to Nori code.** The extern signature tells you the type, method name, parameter types, and return type. `SystemSingle.__op_Addition__SystemSingle_SystemSingle__SystemSingle` is `float + float = float`.
- **Trace jumps for control flow.** `JUMP_IF_FALSE` is an `if` branch (or the exit condition of a loop). An unconditional `JUMP` backwards is the bottom of a loop. `JUMP, 0xFFFFFFFC` means the event handler is done.
- **Look for COPY patterns.** A `PUSH source / PUSH dest / COPY` sequence is a variable assignment. This is how `let x = expr` or `x = expr` appears in the output.
- **Temporaries are ephemeral.** Slots like `__tmp_3_SystemSingle` exist only because the VM has no registers. They are written to once and read once. You can mentally substitute the temp's value inline.
