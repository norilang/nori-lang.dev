---
title: Debugging
description: Reading compiler errors, understanding assembly output, and debugging Nori programs.
sidebar:
  order: 4
---

When something goes wrong in a Nori program, the information you need comes from two sources: compiler errors (caught before your code runs) and runtime behavior (observed in the Unity Console during Play mode). This page covers how to read both.

## Reading error messages

Every Nori error follows the same structure:

```
error[E0042]: Generic types are not supported
  --> scripts/inventory.nori:15:5
   |
15 |     let items: List<Item> = []
   |                ^^^^^^^^^^
   |
   Udon does not support generic collection types like List<T>.
   .NET generics (List<T>, Dictionary<K,V>, etc.) are not part of the extern whitelist.
   This is a fundamental limitation of the Udon VM, not a Nori limitation.

   help: Use a typed array instead: int[], string[], GameObject[]
```

The parts of the message are:

1. **Severity and code** -- `error[E0042]`. The code uniquely identifies the error type and links to a dedicated documentation page.
2. **Title** -- `Generic types are not supported`. A short description of what went wrong.
3. **Source location** -- `scripts/inventory.nori:15:5`. The file, line number, and column number.
4. **Source snippet** -- The actual line of code with `^` characters underlining the problematic span.
5. **Explanation** -- A longer description of why this happened and what it means.
6. **Suggestion** -- Prefixed with `help:`, a concrete recommendation for fixing the problem.

## Error categories

Error codes are grouped by range according to which compiler stage produced them:

| Code range    | Stage           | Description                                                   |
|---------------|-----------------|---------------------------------------------------------------|
| E0001 -- E0009 | Lexer          | Character-level problems: unterminated strings, invalid characters, unclosed block comments. |
| E0010 -- E0039 | Parser         | Syntax errors: unexpected tokens, missing keywords, invalid declarations, bad send targets. |
| E0040 -- E0069 | Type system    | Type mismatches, unsupported types like generics.             |
| E0070 -- E0099 | Scope          | Undefined variables or functions.                             |
| E0100 -- E0129 | Constraints    | Language-level restrictions like recursion.                   |
| E0130 -- E0159 | Externs        | Method not found, ambiguous overloads, read-only properties, invalid enum values. |
| W0001 -- W0099 | Warnings       | Non-fatal issues like unrecognized event names.               |

Errors (E prefix) halt compilation. Warnings (W prefix) produce output but flag potential problems.

## Common errors and fixes

### E0070: Undefined variable

```
error[E0070]: Undefined variable
  --> door.nori:8:5
   |
 8 |     is_opn = !is_opn
   |     ^^^^^^
   |
   This variable name was not found in the current scope. Variables must be declared
   with 'let' before they can be used.

   help: Check for typos in the variable name, or add a declaration.
```

**Cause:** The variable name does not match any declaration. This is almost always a typo.

**Fix:** Check the spelling against the variable declaration. In this case, `is_opn` should be `is_open`.

### E0130: Method not found

```
error[E0130]: Method not found
  --> player.nori:12:5
   |
12 |     gameObject.setActive(false)
   |                ^^^^^^^^^
   |
   The method was not found on the given type, or no overload matches the provided arguments.

   help: Check the method name and argument types.
```

**Cause:** The method name or argument types do not match any whitelisted Udon extern. Udon method names are case-sensitive and must match the .NET naming convention exactly.

**Fix:** Use the correct casing. Unity API methods use PascalCase: `SetActive`, not `setActive`. Check the [API Reference](/api/) for the exact method signatures available on each type.

### E0040: Type mismatch

```
error[E0040]: Type mismatch
  --> timer.nori:6:21
   |
 6 |     let total: int = elapsed * rate
   |                      ^^^^^^^^^^^^^^
   |
   The types in this expression are not compatible.

   help: Check that both sides of the operation have compatible types.
```

**Cause:** The operand types cannot be used together. Nori supports limited implicit conversions (int to float, int to double, float to double), but other combinations require explicit handling.

**Fix:** Make sure both operands have the same type, or use a type that both can be converted to. If `elapsed` is a `float` and `rate` is an `int`, declaring `rate` as `float` resolves the issue.

### E0042: Generic types are not supported

```
error[E0042]: Generic types are not supported
  --> inventory.nori:3:16
   |
 3 |     let items: List<string> = []
   |                ^^^^^^^^^^^^
   |
   Udon's type system is based on concrete .NET types exposed through the extern system.
   .NET generics (List<T>, Dictionary<K,V>, etc.) are not part of the extern whitelist.
   This is a fundamental limitation of the Udon VM, not a Nori limitation.

   help: Use a typed array instead: int[], string[], GameObject[]
```

**Cause:** Udon does not whitelist generic .NET types. This is a VM-level limitation that cannot be worked around.

**Fix:** Use typed arrays instead of generic collections:

```rust
// Instead of List<string>:
let items: string[] = []

// Instead of Dictionary<string, int>:
// Use parallel arrays or a different data structure
let keys: string[] = []
let values: int[] = []
```

### E0100: Recursion detected

```
error[E0100]: Recursion detected
  --> math.nori:1:1
   |
 1 | fn factorial(n: int): int {
   | ^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   Udon has no call stack, so recursive function calls are not possible.
   The compiler detected a cycle in the call graph.

   help: Rewrite using iterative loops (while, for) instead of recursive calls.
```

**Cause:** Nori functions store their return address in a single heap variable. Recursive calls overwrite this address, making it impossible to return to the correct location. The compiler detects this at compile time and rejects the program.

**Fix:** Convert recursive logic to an iterative loop:

```rust
// Instead of recursive factorial:
fn factorial(n: int): int {
    let result: int = 1
    let i: int = 1
    while i <= n {
        result = result * i
        i = i + 1
    }
    return result
}
```

## Reading assembly output

When debugging behavior that seems correct at the source level but produces unexpected results at runtime, it can help to inspect the generated Udon Assembly. The compiler produces `.uasm` files alongside each compiled `.nori` file.

### Understanding variable names

In the data section:

- **User-declared variables** keep their original names: `speed`, `score`, `is_open`.
- **Compiler temporaries** are named `__tmp_N_Type`: `__tmp_0_SystemInt32`, `__tmp_3_SystemBoolean`. These hold intermediate expression results.
- **Constants** are named `__const_N_Type`: `__const_0_SystemString`, `__const_1_SystemInt32`. These are deduplicated -- the same literal value used multiple times shares one heap slot.
- **Function plumbing** uses `__retaddr_funcName`, `__param_funcName_paramName`, and `__retval_funcName`.
- **This-references** are `__this_UnityEngineGameObject_0`, `__this_UnityEngineTransform_0`, and `__this_VRCUdonCommonInterfacesIUdonEventReceiver_0`.

### Tracing execution

To follow what happens at runtime:

1. Find the event label you are interested in (e.g., `_interact:`).
2. Read the instructions top to bottom.
3. For each `PUSH`, note the heap variable name. Before an `EXTERN`, the pushed addresses are the inputs and output (last push = output). Before a `COPY`, the first push is the source and the second is the destination.
4. When you hit a `JUMP_IF_FALSE`, the condition was evaluated by the preceding instructions. The target address tells you where execution goes if the condition is false.
5. An unconditional `JUMP` backwards means you are at the bottom of a loop. A `JUMP` forward means you are skipping over an else branch or exiting a block.
6. `JUMP, 0xFFFFFFFC` means the event handler is done.

### Matching externs to source code

The extern signature encodes everything you need to identify the original Nori operation:

| Extern signature | Nori equivalent |
|---|---|
| `SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32` | `intA + intB` |
| `SystemSingle.__op_Multiply__SystemSingle_SystemSingle__SystemSingle` | `floatA * floatB` |
| `SystemBoolean.__op_UnaryNegation__SystemBoolean__SystemBoolean` | `!boolVal` |
| `UnityEngineTransform.__get_position__UnityEngineVector3` | `transform.position` (getter) |
| `UnityEngineTransform.__set_position__UnityEngineVector3__SystemVoid` | `transform.position = v` (setter) |
| `UnityEngineDebug.__Log__SystemObject__SystemVoid` | `log(...)` |
| `SystemString.__Concat__SystemString_SystemString__SystemString` | String concatenation (from interpolation) |

## Runtime debugging

Once your program compiles successfully, runtime issues are diagnosed through the Unity Console.

### Console output

Nori provides three logging functions, each corresponding to a Unity Console message level:

```rust
log("Normal message")     // white text in Console
warn("Something odd")     // yellow warning
error("Something broke")  // red error
```

Use string interpolation to inspect variable values:

```rust
log("position = {transform.position}")
log("score = {score}, is_open = {is_open}")
log("delta = {Time.deltaTime}")
```

### Common runtime issues

**Null references.** If a `pub let` variable has not been assigned in the Inspector, it will be `null` at runtime. Accessing properties or calling methods on a null reference produces a runtime error in the Unity Console. Check that all public variables have been assigned.

**Ownership errors.** Synced variables can only be modified by the object's owner. If a non-owner tries to change a `sync` variable, the change is silently ignored. Use `Networking.IsOwner(localPlayer, gameObject)` to check ownership before modifying synced state, or use `Networking.SetOwner(localPlayer, gameObject)` to take ownership first.

**Event ordering.** `Start` fires once when the world loads, but the order in which different objects' `Start` events run is not guaranteed. Do not rely on one object's `Start` having already run when another object's `Start` executes.

**Frame-rate dependent behavior.** Code in `on Update` runs once per frame. If you move an object by a fixed amount each frame, the speed will vary with frame rate. Always multiply movement by `Time.deltaTime` to make it frame-rate independent:

```rust
on Update {
    // Wrong: moves faster at higher frame rates
    // position = position + 0.1

    // Correct: moves at constant speed regardless of frame rate
    let step: float = speed * Time.deltaTime
    position = position + step
}
```
