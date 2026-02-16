---
title: Your First World
description: Build a simple interactive VRChat world with Nori in three steps.
sidebar:
  order: 3
---

This tutorial walks you through building a small interactive VRChat world with Nori. Each step introduces new language features and builds on the one before it. By the end, you will have a clickable object, an animated door, and a networked scoreboard.

## Step 1: Clickable Object

Start with the simplest possible interaction: an object that counts how many times you click it.

1. Right-click in the **Project** window and select **Create > Nori Script**. Rename it to `click_counter.nori`.
2. Open it in a text editor and replace the template with the following code:

```rust
let count: int = 0

on Interact {
    count = count + 1
    log("Clicked {count} times!")
}
```

3. Create a **Cube** in your scene (GameObject > 3D Object > Cube).
4. Drag `click_counter.nori` from the Project window onto the Cube in the **Hierarchy**.
5. Enter Play mode and click the Cube. The Console should show "Clicked 1 times!", "Clicked 2 times!", and so on.

### What this code does

- `let count: int = 0` declares a variable named `count` with type `int` and an initial value of `0`. Every variable in Nori requires an explicit type.
- `on Interact { ... }` defines an event handler that runs whenever a player clicks the object. `Interact` is a built-in VRChat event.
- `log("Clicked {count} times!")` prints a message to the console. The `{count}` syntax is **string interpolation** -- it inserts the current value of `count` into the string.

## Step 2: Toggle Door

Next, create a door that swings open and closed when clicked. This introduces public variables, booleans, and per-frame updates.

1. Create a new Nori script (**Create > Nori Script**) and rename it to `toggle_door.nori`.
2. Open it in a text editor and replace the template with the following code:

```rust
pub let speed: float = 90.0
let is_open: bool = false
let current_angle: float = 0.0
let target_angle: float = 0.0

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
        if current_angle < target_angle {
            current_angle = current_angle + step
            if current_angle > target_angle {
                current_angle = target_angle
            }
        } else {
            current_angle = current_angle - step
            if current_angle < target_angle {
                current_angle = target_angle
            }
        }
    }
}
```

3. Add a second GameObject to your scene to serve as the door (e.g., a scaled Cube).
4. Drag `toggle_door.nori` onto the door GameObject in the **Hierarchy**.
5. In the Inspector, you will see a **Speed** field under Public Variables that you can edit. Enter Play mode and click the door to toggle it.

### What this code does

- `pub let speed: float = 90.0` declares a **public** variable. The `pub` keyword exposes the variable in the Unity Inspector so you can tweak it without editing code. Here it controls how many degrees per second the door rotates.
- `let is_open: bool = false` is a boolean that tracks whether the door is currently open or closed. The `!` operator flips it between `true` and `false`.
- `on Update { ... }` runs every single frame. This is where you put animation or continuous logic. Because frame rates vary between machines, you should never move things by a fixed amount per frame.
- `Time.deltaTime` returns the time in seconds since the last frame. Multiplying your speed by `Time.deltaTime` ensures the door moves at the same rate regardless of frame rate. At 90 FPS, `deltaTime` is small; at 30 FPS, it is larger, so the door covers the same distance per second either way.
- The nested `if` statements clamp the angle so the door stops exactly at the target instead of overshooting.

## Step 3: Networked Scoreboard

Finally, build a scoreboard that syncs across all players in the world. This introduces networking, custom events, and functions.

1. Create a new Nori script (**Create > Nori Script**) and rename it to `scoreboard.nori`.
2. Open it in a text editor and replace the template with the following code:

```rust
pub let max_score: int = 10
sync none score: int = 0
let is_game_over: bool = false

on Start {
    log("Scoreboard ready!")
}

fn update_display() {
    log("Score: {score}")
}

event AddPoint {
    score = score + 1
    update_display()
    if score >= max_score {
        send GameOver to All
    }
}

event GameOver {
    is_game_over = true
    log("Game over! Final score: {score}")
}

on Interact {
    if is_game_over {
        log("Game is over!")
        return
    }
    send AddPoint to All
}
```

3. Create a new GameObject for the scoreboard.
4. Drag `scoreboard.nori` onto the scoreboard GameObject in the **Hierarchy**.
5. Enter Play mode. Click the scoreboard to increment the score. After reaching the max score, further clicks are ignored.

### What this code does

- `sync none score: int = 0` declares a **synced variable**. The `sync` keyword tells VRChat to replicate this variable across the network so all players see the same value. The `none` sync mode means the value is sent as-is with no interpolation.
- `fn update_display() { ... }` defines a **function**. Functions let you organize reusable logic. Call them by name like any other function: `update_display()`.
- `event AddPoint { ... }` defines a **custom event**. Unlike built-in events like `Start` or `Interact`, custom events are ones you define yourself. They can be triggered from code using `send`.
- `send AddPoint to All` triggers the `AddPoint` event on **all clients** in the world, not just the local player. This is how you coordinate actions across the network. You can also use `send ... to Owner` to target only the object's owner.
- `return` exits the current event handler early. Here it prevents any interaction after the game ends.

## What you learned

Across these three steps, you covered the core building blocks of Nori:

- **Variables** with `let` and type annotations (`int`, `float`, `bool`)
- **Public variables** with `pub let` for Inspector-editable values
- **Built-in events** like `Start`, `Interact`, and `Update`
- **String interpolation** with `{variable}` inside strings
- **Conditionals** with `if` / `else`
- **Frame-based animation** with `Time.deltaTime` in `on Update`
- **Functions** with `fn` for reusable logic
- **Networking** with `sync`, custom `event` blocks, and `send ... to All`

## Next steps

- [Examples](/getting-started/examples/) — More annotated code patterns for common VRChat scenarios like teleporters and timers.
- [Language Reference](/language/variables/) — Full documentation of Nori's syntax, types, and features.
