---
title: Limitations
description: What Nori cannot do — Udon VM constraints explained with workarounds.
sidebar:
  order: 10
---

Nori compiles to Udon Assembly, and Udon Assembly runs inside VRChat's Udon Virtual Machine. The Udon VM is a sandboxed, heap-only, extern-driven execution environment. It does not expose the full .NET runtime. This page documents what Nori cannot do, explains why each limitation exists at the VM level, and provides concrete workarounds.

## Constraint summary

| Feature | Why not | Workaround |
|---------|---------|------------|
| `List<T>`, `Dictionary<K,V>` | Udon does not support .NET generics | Typed arrays (`int[]`, `string[]`) |
| Classes, structs, interfaces | Udon has no user-defined types | Multiple variables, parallel arrays |
| Recursion | No call stack in Udon VM | Iterative loops (`while`, `for`) |
| Closures, lambdas | No local scopes in Udon VM | Module-level fields |
| `async`/`await` | Not exposed in Udon | Update-loop state machines |
| `try`/`catch` | Exception handling not exposed | Null checks, validation |
| File I/O | VRChat security sandbox | VRChat Persistence API |
| Arbitrary HTTP | VRChat security sandbox | VRChat approved APIs |
| Local variables | Heap-only memory model | All variables are module-level fields |
| Operator overloading | No user-defined types | Named functions |
| Short-circuit `&&`/`||` | Uses EXTERN-based evaluation | Both sides always evaluate; use nested `if` |

## Generic collections

### What

You cannot use `List<T>`, `Dictionary<K,V>`, `Queue<T>`, `HashSet<T>`, or any other generic collection type.

### Why

Udon's type system is built on a whitelist of concrete .NET types exposed through the extern mechanism. .NET generics require runtime type specialization, which is not part of the extern whitelist. The Udon VM does not have the infrastructure to instantiate generic types.

### Workaround

Use typed arrays. Arrays are the only collection type available in Udon.

```rust
// Instead of List<int>:
let scores: int[] = [0, 0, 0, 0, 0]
let score_count: int = 0

fn add_score(value: int) {
    if score_count < scores.Length {
        scores[score_count] = value
        score_count = score_count + 1
    }
}
```

```rust
// Instead of Dictionary<string, int>, use parallel arrays:
let keys: string[] = ["health", "score", "level"]
let values: int[] = [100, 0, 1]

fn lookup(key: string) -> int {
    for i in 0..keys.Length {
        if keys[i] == key {
            return values[i]
        }
    }
    return -1
}
```

See error [E0042](/errors/E0042/) for the compiler diagnostic.

## User-defined types

### What

You cannot define classes, structs, interfaces, or enums. There is no `class`, `struct`, `interface`, or `enum` keyword.

### Why

Udon's type system only supports types that exist in the extern whitelist -- concrete .NET types that VRChat has explicitly exposed. There is no mechanism to register new types at compile time. The Udon VM's heap stores values by their extern type name, and user-defined types would have no corresponding entry.

### Workaround

Use multiple variables or parallel arrays to represent structured data.

```rust
// Instead of a Player struct with name, score, and alive fields:
let player_names: string[] = null
let player_scores: int[] = null
let player_alive: bool[] = null

fn get_player_score(index: int) -> int {
    return player_scores[index]
}

fn set_player_alive(index: int, alive: bool) {
    player_alive[index] = alive
}
```

For simple groupings, use a naming convention:

```rust
let door_is_open: bool = false
let door_angle: float = 0.0
let door_speed: float = 90.0
let door_target: float = 0.0
```

## Recursion

### What

A function cannot call itself, directly or indirectly. The compiler detects recursive call cycles and reports error [E0100](/errors/E0100/).

### Why

Udon has no call stack. When Nori compiles a function call, it stores the return address in a single heap variable and jumps to the function body. If the function calls itself, the original return address is overwritten, and the program cannot return to the correct location. True recursion requires a stack that grows with each call, which does not exist in the Udon VM.

### Workaround

Rewrite recursive algorithms as iterative loops.

```rust
// Recursive factorial (NOT valid):
// fn factorial(n: int) -> int {
//     if n <= 1 { return 1 }
//     return n * factorial(n - 1)
// }

// Iterative factorial (valid):
fn factorial(n: int) -> int {
    let result: int = 1
    let i: int = 2
    while i <= n {
        result = result * i
        i = i + 1
    }
    return result
}
```

```rust
// Recursive search (NOT valid):
// fn binary_search(arr: int[], target: int, low: int, high: int) -> int { ... }

// Iterative search (valid):
fn linear_search(arr: int[], target: int) -> int {
    for i in 0..arr.Length {
        if arr[i] == target {
            return i
        }
    }
    return -1
}
```

## Closures and lambdas

### What

You cannot create anonymous functions, closures, or lambda expressions. Functions cannot be stored in variables or passed as arguments.

### Why

Closures capture local scope, and Udon has no local scope. All variables are heap-allocated module-level fields. There is no stack frame to close over, no function pointer type in the extern whitelist, and no way to represent a closure object in Udon's type system.

### Workaround

Use module-level variables to communicate between functions, and call functions by name.

```rust
// Instead of: items.filter(x => x > threshold)
let filtered_count: int = 0

fn count_above_threshold(items: int[], threshold: int) -> int {
    filtered_count = 0
    for i in 0..items.Length {
        if items[i] > threshold {
            filtered_count = filtered_count + 1
        }
    }
    return filtered_count
}
```

## Async/await

### What

There is no `async`, `await`, `Task`, or `Promise` type. You cannot write asynchronous code with coroutine syntax.

### Why

The Udon VM executes synchronously within each event handler. There is no task scheduler, no coroutine runtime, and no way to yield execution partway through a handler and resume later. The `async`/`await` pattern relies on compiler-generated state machines backed by `Task<T>`, which is not in the extern whitelist.

### Workaround

Use the `Update` event with state variables to implement timed or sequenced behavior.

```rust
// Instead of: await Task.Delay(3000)
let wait_timer: float = 0.0
let is_waiting: bool = false

on Interact {
    is_waiting = true
    wait_timer = 3.0
    log("Waiting 3 seconds...")
}

on Update {
    if is_waiting {
        wait_timer = wait_timer - Time.deltaTime
        if wait_timer <= 0.0 {
            is_waiting = false
            log("Done waiting!")
        }
    }
}
```

For multi-step sequences, use a state machine:

```rust
let sequence_state: int = 0
let sequence_timer: float = 0.0

event StartSequence {
    sequence_state = 1
    sequence_timer = 2.0
}

on Update {
    if sequence_state == 1 {
        log("Phase 1...")
        sequence_timer = sequence_timer - Time.deltaTime
        if sequence_timer <= 0.0 {
            sequence_state = 2
            sequence_timer = 3.0
        }
    } else if sequence_state == 2 {
        log("Phase 2...")
        sequence_timer = sequence_timer - Time.deltaTime
        if sequence_timer <= 0.0 {
            sequence_state = 0
            log("Sequence complete")
        }
    }
}
```

## Try/catch

### What

There is no `try`, `catch`, `finally`, or `throw`. You cannot handle exceptions.

### Why

Udon does not expose .NET's exception handling mechanism. The extern system calls whitelisted methods, and if one of those methods throws internally, the Udon VM halts the event handler. There is no way to catch or recover from exceptions in user code.

### Workaround

Validate inputs before using them. Check for null. Check array bounds. Check ownership before writing synced variables.

```rust
// Instead of: try { items[index] } catch { ... }
fn safe_get(items: string[], index: int) -> string {
    if index < 0 {
        return ""
    }
    if index >= items.Length {
        return ""
    }
    return items[index]
}
```

```rust
// Instead of: try { obj.DoThing() } catch (NullReferenceException) { }
fn safe_activate(obj: GameObject) {
    if obj != null {
        obj.SetActive(true)
    }
}
```

## File I/O

### What

You cannot read or write files, access the filesystem, or open network sockets.

### Why

VRChat runs in a security sandbox. Allowing arbitrary file or network access would let malicious worlds steal data or attack systems. Udon does not expose `System.IO`, `System.Net`, or any filesystem APIs.

### Workaround

For persistent data, use VRChat's Persistence API (PlayerData) if available in your SDK version. For sharing data between worlds, use VRChat's approved APIs.

## Arbitrary HTTP requests

### What

You cannot make HTTP requests to arbitrary URLs. There is no `HttpClient`, `WebRequest`, or `fetch`.

### Why

Same security sandbox as file I/O. VRChat restricts network access to prevent data exfiltration and abuse.

### Workaround

Use VRChat's approved networking features: synced variables for player-to-player data, and VRChat's image/video loading APIs for approved external content.

## Local variables

### What

All variables are module-level heap fields, even when declared inside a function or event body. There are no stack-allocated local variables.

### Why

The Udon VM uses a flat heap for all data storage. There is no stack. Each variable declaration creates a named slot in the heap that persists for the lifetime of the program. The compiler places all variables at module scope regardless of where they appear in the source code.

### Workaround

This is usually transparent -- the variables work as expected for most code. Be aware that "local" variables persist their values between calls:

```rust
fn increment() {
    let counter: int = 0   // NOT reset each call -- this is a module field
    counter = counter + 1
    log("Counter: {counter}")
}
```

If you need a fresh value each call, assign it explicitly:

```rust
fn increment() {
    let counter: int = 0
    counter = 0             // explicitly reset
    counter = counter + 1
    log("Counter: {counter}")  // always prints 1
}
```

## Operator overloading

### What

You cannot define custom operators for your own types. There is no `operator+` or similar mechanism.

### Why

Nori has no user-defined types, so there is nothing to overload operators on. The operators that exist (arithmetic, comparison, logical) are hardcoded to work with the types provided by the extern whitelist (int, float, Vector3, etc.).

### Workaround

Use named functions:

```rust
// Instead of overloading + for a custom "point" type:
fn add_points(ax: float, ay: float, bx: float, by: float) {
    result_x = ax + bx
    result_y = ay + by
}
```

## Short-circuit evaluation

### What

The `&&` and `||` operators always evaluate both operands. There is no short-circuit evaluation.

### Why

In Nori, `&&` and `||` compile to Udon EXTERN calls (`ConditionalAnd`, `ConditionalOr`). Both operands must be evaluated and pushed onto the stack before the extern is called. The Udon VM has no mechanism for conditionally skipping an operand.

### Workaround

Use nested `if` statements for guard patterns:

```rust
// WRONG: obj.activeSelf evaluates even if obj is null
if obj != null && obj.activeSelf {
    log("Active")
}

// CORRECT: nested if prevents the null access
if obj != null {
    if obj.activeSelf {
        log("Active")
    }
}
```

```rust
// WRONG: division happens even if divisor is zero
if divisor != 0 && (value / divisor) > threshold {
    log("Above threshold")
}

// CORRECT: nested if prevents division by zero
if divisor != 0 {
    if (value / divisor) > threshold {
        log("Above threshold")
    }
}
```

## See also

- [Language Overview](/language/) -- What Nori can do
- [Types](/language/types/) -- Available types and the extern system
- [Functions](/language/functions/) -- How function calls work without a call stack
- [Networking](/language/networking/) -- Networking constraints and patterns
