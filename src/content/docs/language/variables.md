---
title: Variables
description: Variable declarations in Nori — let, pub let, sync, and type annotations.
sidebar:
  order: 2
---

Variables in Nori declare fields on the UdonBehaviour. Every variable you write -- whether at the top level of the file or inside an event or function body -- becomes a heap-allocated field in Udon's memory. Nori has no stack-allocated local variables.

## Declaring variables

The basic variable declaration uses `let`:

```rust
let health: int = 100
let player_name: string = "Unknown"
let is_active: bool = false
let move_speed: float = 5.0
```

Every declaration requires three things:

1. A name
2. A type annotation (after the colon)
3. An initial value (after the equals sign)

## Public variables

Use `pub let` to make a variable visible in the Unity Inspector. This lets designers adjust values without editing code:

```rust
pub let max_health: int = 100
pub let greeting: string = "Welcome!"
pub let door_speed: float = 90.0
pub let target_object: GameObject = null
```

Public variables appear as editable fields on the UdonBehaviour component in the Unity Editor. The initial value in the code serves as the default, but the Inspector value takes priority at runtime.

## Doc comments

Use `///` comments directly above a `pub let` declaration to attach a description that appears as a tooltip in the Unity Inspector:

```rust
/// Maximum health points for this character.
pub let max_health: int = 100

/// How fast the door opens, in degrees per second.
/// Higher values make the animation snappier.
pub let door_speed: float = 90.0
```

Multiple `///` lines are joined into a single tooltip string. Blank lines between the comment and the declaration are allowed. Only `///` comments are extracted — regular `//` comments are ignored.

Doc comments only apply to `pub let` variables. Comments above private `let` or `sync` declarations have no effect in the inspector.

## Synced variables

Use `sync` to declare a variable that is replicated across the network to all players:

```rust
sync none score: int = 0
sync linear position_x: float = 0.0
sync smooth rotation_y: float = 0.0
```

The sync mode controls how remote clients interpolate between network updates:

| Mode | Behavior |
|------|----------|
| `none` | No interpolation. The value jumps to the latest synced value on each network update. Use for discrete state like scores, toggles, or IDs. |
| `linear` | Linear interpolation between the old and new values over time. Use for values that change at a constant rate, like timers. |
| `smooth` | Smooth (ease-in/ease-out) interpolation. Use for positions, rotations, or any value that should appear fluid. |

Synced variables are always implicitly public -- they appear in the Inspector and are part of the behaviour's serialized state.

## Type annotations

Type annotations are required on every variable declaration. Nori does not infer types:

```rust
let count: int = 0          // correct
let count = 0                // error: missing type annotation
```

See [Types](/language/types/) for the full list of available types.

## Default values

Every type has a default value that you can use as an initializer:

```rust
let a: int = 0
let b: float = 0.0
let c: bool = false
let d: string = ""
let e: GameObject = null
let f: Vector3 = Vector3.zero
```

Reference types (GameObjects, Transforms, Players, etc.) default to `null`. Numeric types default to zero. Booleans default to `false`.

## Array variables

Declare array variables with bracket syntax on the type:

```rust
let scores: int[] = null
let names: string[] = null
pub let waypoints: GameObject[] = null
```

Arrays are reference types and are typically initialized to `null` in code. For public arrays, you assign the elements through the Unity Inspector. See [Types](/language/types/) for more about arrays.

## All variables are module-level fields

This is the most important thing to understand about Nori variables: there are no local variables. Even when you write `let` inside an event handler or function body, the variable becomes a module-level field in Udon's heap.

```rust
on Interact {
    let count: int = 0     // this is NOT a local variable
    count = count + 1      // this modifies a module-level field
    log("Count: {count}")
}
```

In the example above, `count` is a heap-allocated field, just like a variable declared at the top level. It is initialized to `0` at program start (in the `Start` event), not each time `Interact` fires. The declaration inside the block is syntactic convenience for scoping the name, but the storage is shared across all calls.

This means that "local" variables persist their values between event invocations. If you click the object three times, the count will be 3, not 1 -- because `count` is a field, not a stack variable.

If you want a variable to reset each time an event fires, assign it explicitly:

```rust
let count: int = 0

on Interact {
    count = 0              // explicitly reset
    count = count + 1
    log("Count: {count}")  // always prints 1
}
```

## Common patterns

### Configuration with public variables

```rust
pub let damage: int = 10
pub let cooldown: float = 2.0
pub let effect_color: Color = null
pub let hit_sound: AudioSource = null
```

### Networked state

```rust
sync none is_locked: bool = false
sync none owner_name: string = ""
sync smooth door_angle: float = 0.0
```

### Tracking state across events

```rust
let last_interact_time: float = 0.0

on Interact {
    let now: float = Time.time
    if now - last_interact_time > 1.0 {
        last_interact_time = now
        log("Interaction accepted")
    } else {
        log("Too fast, wait a moment")
    }
}
```

## Common mistakes

**Thinking `let` inside a function creates a local variable:**

```rust
fn reset_and_count() {
    let x: int = 0   // x is a module field, NOT a stack local
    x = x + 1        // x persists between calls
}
```

Every call to `reset_and_count` increments the same `x`. If you need a fresh value each call, assign it explicitly at the start of the function.

**Forgetting the type annotation:**

```rust
let speed = 5.0    // error: expected ':'
```

Nori requires explicit types. Write `let speed: float = 5.0`.

**Using `var` or `const` instead of `let`:**

Nori uses `let` for all variable declarations. There is no `var`, `const`, or `val` keyword.

## See also

- [Types](/language/types/) -- Full list of available types
- [Networking](/language/networking/) -- How synced variables work over the network
- [Limitations](/language/limitations/) -- Why there are no local variables
