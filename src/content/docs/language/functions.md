---
title: Functions
description: Function declarations, parameters, return values, and how they compile to Udon.
sidebar:
  order: 6
---

Functions in Nori let you extract reusable logic into named blocks. They can take parameters, return values, and access all module-level variables. Functions are declared with the `fn` keyword and can be called from events, custom events, or other functions.

## Declaring a function

A basic function with no parameters and no return value:

```rust
fn greet() {
    log("Hello!")
}
```

### With parameters

Parameters are declared with their types after a colon:

```rust
fn greet_player(name: string) {
    log("Hello, {name}!")
}

fn add(a: int, b: int) {
    log("Sum: {a + b}")
}
```

### With a return type

Use `->` followed by the return type to declare a function that returns a value:

```rust
fn max(a: int, b: int) -> int {
    if a > b {
        return a
    }
    return b
}

fn get_speed() -> float {
    return base_speed * speed_multiplier
}
```

Every code path through a function with a return type must end with a `return` statement.

### Void functions

Functions without a `->` return type are void. They can use `return` without a value to exit early:

```rust
fn update_display() {
    if !is_active {
        return
    }
    log("Score: {score}")
    log("Health: {health}")
}
```

## Calling functions

Call a function by name with parentheses:

```rust
on Start {
    greet()
    greet_player("Alice")
    let biggest: int = max(10, 20)
    log("Max is {biggest}")
}
```

Functions must be declared in the same file. There is no import system -- each `.nori` file is self-contained.

## Accessing module variables

Functions can read and write any module-level variable:

```rust
let score: int = 0
let combo: int = 0

fn add_score(points: int) {
    score = score + (points * combo)
    if score > high_score {
        high_score = score
    }
}

fn reset() {
    score = 0
    combo = 1
}
```

Since all variables in Nori are module-level fields, functions naturally have access to the full state of the behaviour.

## How functions compile

Nori functions do not compile to true function calls. Udon has no call stack, so the compiler emits each function as a labeled block of instructions. A function call is implemented as:

1. Copy argument values into the function's parameter variables.
2. Store the return address in a heap variable.
3. `JUMP` to the function's label.
4. At the end of the function, `JUMP_INDIRECT` back to the stored return address.

This means function calls work, but with limitations:

- There is no call stack. Each function has exactly one return-address slot.
- Calling a function while it is already executing overwrites its return address.
- This is why recursion is not possible.

You do not need to think about this for normal code. The compiler handles it transparently. But it explains why certain features (recursion, closures) are not supported.

## No recursion

Recursive function calls are a compile error ([E0100](/errors/E0100/)). The compiler builds a call graph and checks for cycles:

```rust
// error E0100: Recursion detected
fn countdown(n: int) {
    if n <= 0 {
        return
    }
    log("{n}")
    countdown(n - 1)   // recursive call — not allowed
}
```

Mutual recursion is also detected:

```rust
// error E0100: Recursion detected
fn ping() {
    pong()
}

fn pong() {
    ping()
}
```

Use iterative loops instead:

```rust
fn countdown(n: int) {
    let i: int = n
    while i > 0 {
        log("{i}")
        i = i - 1
    }
}
```

## No closures or first-class functions

Functions cannot be stored in variables, passed as arguments, or returned from other functions. There are no lambdas, anonymous functions, or function pointers:

```rust
// Not valid Nori:
let callback: fn() = greet    // no function types
items.forEach(process)         // no higher-order functions
```

## Parameter passing

Parameters behave like module-level variables. When you call a function, the argument values are copied into the parameter's heap slots before the function body executes:

```rust
fn set_position(x: float, y: float, z: float) {
    // x, y, z are module-level variables with the passed-in values
    log("Moving to {x}, {y}, {z}")
}
```

Since parameters are heap variables, they persist between calls. This is normally invisible, but be aware that reading a parameter before it is set (which the current syntax prevents) would see the value from the previous call.

## Common patterns

### Helper functions

```rust
fn clamp_int(value: int, min_val: int, max_val: int) -> int {
    if value < min_val {
        return min_val
    }
    if value > max_val {
        return max_val
    }
    return value
}
```

### Display update

```rust
let score: int = 0
let health: int = 100

fn update_hud() {
    log("Score: {score} | Health: {health}")
}

on Start {
    update_hud()
}

event ScoreChanged {
    update_hud()
}
```

### Guard function

```rust
fn is_owner() -> bool {
    return Networking.IsOwner(localPlayer, gameObject)
}

on Interact {
    if !is_owner() {
        Networking.SetOwner(localPlayer, gameObject)
    }
    // now safe to modify synced variables
}
```

### Initialization function

```rust
fn initialize() {
    score = 0
    health = max_health
    is_game_over = false
    update_hud()
}

on Start {
    initialize()
}

event ResetGame {
    initialize()
}
```

## Common mistakes

**Trying to use recursion:**

```rust
// error E0100
fn factorial(n: int) -> int {
    if n <= 1 {
        return 1
    }
    return n * factorial(n - 1)
}
```

Rewrite with a loop:

```rust
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

**Expecting local parameters:**

```rust
fn process(value: int) {
    // value is a module-level field, not a stack local
    // it persists between calls
}
```

This rarely causes issues because parameters are overwritten at each call site before the body runs, but it is good to understand the underlying behavior.

**Forgetting the return type arrow:**

```rust
// error: missing ->
fn get_name() string {
    return "default"
}

// correct
fn get_name() -> string {
    return "default"
}
```

## See also

- [Events](/language/events/) -- Built-in event handlers (different from functions)
- [Custom Events](/language/custom-events/) -- Events that can be sent over the network (functions cannot)
- [Limitations](/language/limitations/) -- Why recursion and closures are not supported
