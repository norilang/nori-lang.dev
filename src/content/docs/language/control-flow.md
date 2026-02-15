---
title: Control Flow
description: Conditionals, loops, break, continue, and return in Nori.
sidebar:
  order: 5
---

Nori provides `if`/`else` for branching, `while` and `for..in` for looping, and `break`, `continue`, and `return` for flow control. There is no `switch`, `match`, or ternary operator.

## If / else

The `if` statement evaluates a condition and executes a block of code if the condition is `true`. Braces are required. Parentheses around the condition are not used.

```rust
if health <= 0 {
    log("Game over")
}
```

### Else

```rust
if is_open {
    log("Door is open")
} else {
    log("Door is closed")
}
```

### Else if

Chain multiple conditions with `else if`:

```rust
if score >= 100 {
    log("Excellent!")
} else if score >= 50 {
    log("Good")
} else if score >= 25 {
    log("Okay")
} else {
    log("Keep trying")
}
```

There is no limit to the number of `else if` branches.

### Nesting

```rust
if player != null {
    if player.isLocal {
        log("This is the local player")
    } else {
        log("This is a remote player")
    }
}
```

Nesting is the correct way to implement guard patterns, since Nori does not short-circuit `&&` and `||`. See [Expressions](/language/expressions/) for details.

## While loop

The `while` loop repeats a block as long as the condition is `true`:

```rust
let i: int = 0
while i < 10 {
    log("Step {i}")
    i = i + 1
}
```

The condition is checked before each iteration. If the condition is `false` on the first check, the body never executes.

### Counted loop with while

```rust
let count: int = 0
while count < items.Length {
    log("Item: {items[count]}")
    count = count + 1
}
```

## For..in range

The `for..in` loop with a range iterates over a sequence of integers:

```rust
for i in 0..10 {
    log("Index: {i}")
}
```

The range `0..10` produces values 0, 1, 2, ..., 9. The end value is exclusive -- `10` is not included.

The loop variable (`i` in the example) is an `int` and is available inside the loop body. Like all variables in Nori, it is a module-level field, not a stack-local variable.

### Range with expressions

Both the start and end of the range can be expressions:

```rust
for i in start..end {
    log("Value: {i}")
}

for i in 0..items.Length {
    log("Item {i}: {items[i]}")
}
```

## For..in collection

The `for..in` loop can also iterate over an array:

```rust
let names: string[] = ["Alice", "Bob", "Charlie"]

for name in names {
    log("Hello, {name}!")
}
```

The loop variable takes the element type of the array. For a `string[]`, the loop variable is a `string`. For an `int[]`, the loop variable is an `int`.

```rust
let scores: int[] = [10, 20, 30]

for score in scores {
    log("Score: {score}")
}
```

## Break

The `break` statement exits the nearest enclosing loop immediately:

```rust
for i in 0..100 {
    if items[i] == target {
        log("Found at index {i}")
        break
    }
}
```

`break` works in both `while` and `for..in` loops.

## Continue

The `continue` statement skips the rest of the current iteration and proceeds to the next one:

```rust
for i in 0..items.Length {
    if items[i] == "" {
        continue    // skip empty items
    }
    log("Item: {items[i]}")
}
```

## Return

The `return` statement exits the current event handler or function.

In a function with a return type, `return` must include a value:

```rust
fn max(a: int, b: int) -> int {
    if a > b {
        return a
    }
    return b
}
```

In an event handler or a void function, `return` exits without a value:

```rust
on Interact {
    if is_locked {
        log("This is locked")
        return
    }
    log("Interacting...")
}
```

```rust
fn reset() {
    if !is_active {
        return    // exit early
    }
    score = 0
    health = 100
}
```

## No switch or match

Nori does not have a `switch` or `match` statement. Use `if`/`else if`/`else` chains instead:

```rust
// Instead of switch(state):
if state == 0 {
    log("Idle")
} else if state == 1 {
    log("Walking")
} else if state == 2 {
    log("Running")
} else {
    log("Unknown state")
}
```

## Common patterns

### State machine

```rust
let state: int = 0

on Update {
    if state == 0 {
        // Idle state
        if should_activate {
            state = 1
        }
    } else if state == 1 {
        // Active state
        timer = timer - Time.deltaTime
        if timer <= 0.0 {
            state = 2
        }
    } else if state == 2 {
        // Cooldown state
        cooldown = cooldown - Time.deltaTime
        if cooldown <= 0.0 {
            state = 0
        }
    }
}
```

### Search loop with break

```rust
let found_index: int = -1

for i in 0..items.Length {
    if items[i] == target {
        found_index = i
        break
    }
}

if found_index >= 0 {
    log("Found at {found_index}")
} else {
    log("Not found")
}
```

### Filter and count

```rust
let count: int = 0

for i in 0..items.Length {
    if items[i] > threshold {
        count = count + 1
    }
}

log("{count} items above threshold")
```

### Early return guard

```rust
fn process_player(player: Player) {
    if player == null {
        return
    }
    if !player.isLocal {
        return
    }
    // safe to proceed
    log("Processing {player.displayName}")
}
```

## Common mistakes

**Forgetting braces:**

```rust
// error: braces are required
if x > 0
    log("positive")

// correct
if x > 0 {
    log("positive")
}
```

**Adding parentheses around the condition:**

```rust
// This works but is unnecessary
if (x > 0) {
    log("positive")
}

// Preferred style: no parentheses
if x > 0 {
    log("positive")
}
```

Parentheses around the condition are allowed but not idiomatic. Nori follows Rust-style `if` without parentheses.

**Assuming for..in range is inclusive:**

```rust
for i in 0..5 {
    // iterates: 0, 1, 2, 3, 4
    // does NOT include 5
}
```

The end value is exclusive. `0..5` gives you five iterations (0 through 4), not six.

**Using `for` with a C-style syntax:**

```rust
// error: not valid Nori
for (int i = 0; i < 10; i++) { }

// correct
for i in 0..10 { }
```

## See also

- [Expressions](/language/expressions/) -- Conditions and operator precedence
- [Functions](/language/functions/) -- Using `return` with values
- [Events](/language/events/) -- Event handlers where control flow is commonly used
