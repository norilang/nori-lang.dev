---
title: Examples
description: Annotated Nori code examples for common VRChat world patterns.
sidebar:
  order: 4
---

This page collects annotated Nori examples for patterns you will use frequently when building VRChat worlds. Each example is self-contained and includes a breakdown of the key concepts it demonstrates.

## 1. Hello World

The simplest possible Nori program. It logs a message when the world loads and another when a player clicks the object.

```rust
on Start {
    log("Hello from Nori!")
}

on Interact {
    log("You clicked me!")
}
```

**Line-by-line:**

- `on Start { ... }` -- The `Start` event fires once when the UdonBehaviour initializes, typically when the world loads. This is the place to put setup logic.
- `log("Hello from Nori!")` -- Prints a message to the Unity Console (visible in the editor) and the VRChat log output. Useful for debugging.
- `on Interact { ... }` -- The `Interact` event fires when a player points at the object and clicks. The object must have a collider for interaction to work.
- `log("You clicked me!")` -- Prints a second message when the interaction occurs.

**Key concepts:**
- Built-in events (`Start`, `Interact`) define when your code runs.
- `log()` is the primary debugging tool during development.
- Every Nori program is attached to a single GameObject via an UdonBehaviour.

## 2. Toggle Door

A door that swings open and closed when clicked. Demonstrates public variables, per-frame updates, and frame-rate-independent animation.

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

**How it works:**

- `pub let speed: float = 90.0` -- The `pub` keyword exposes this variable in the Unity Inspector. World creators can change the door speed without editing code. The type is `float` because rotation speed involves fractional values.
- `is_open = !is_open` -- The `!` operator negates a boolean. Each click flips the state between open and closed.
- `on Update { ... }` -- This event runs once per rendered frame. Frame rates vary (a VR headset might run at 72 or 90 FPS), so you should never move objects by a fixed amount per frame.
- `Time.deltaTime` -- Returns the elapsed time in seconds since the previous frame. Multiplying by `deltaTime` converts a per-second speed into the correct per-frame increment, making the animation smooth on all hardware.
- The clamping logic (e.g., `if current_angle > target_angle { current_angle = target_angle }`) prevents the door from overshooting its target. Without clamping, the door could swing past 90 degrees and oscillate.

**Key concepts:**
- `pub let` exposes variables to the Inspector for design-time tuning.
- `on Update` is for continuous per-frame logic like animation and physics.
- Always multiply movement by `Time.deltaTime` for frame-rate independence.
- Use clamping to prevent overshoot in incremental animations.

## 3. Networked Scoreboard

A scoreboard that tracks points across all players in a multiplayer session. Demonstrates synced variables, custom events, functions, and network messaging.

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

**How networking works in this example:**

- `sync none score: int = 0` -- The `sync` keyword marks a variable for network replication. When the owner updates this value and serialization is requested, VRChat sends the new value to all other players. The `none` sync mode transmits the value without interpolation (as opposed to `linear` or `smooth`, which interpolate between updates for position-like data).
- `event AddPoint { ... }` -- Custom events are blocks of code that you define and invoke by name. Unlike built-in events (`Start`, `Update`), custom events do not fire automatically. They only run when explicitly triggered with `send`.
- `send AddPoint to All` -- Triggers the `AddPoint` event on every client in the instance, including the sender. This ensures all players run the same logic. You can also use `send ... to Owner` to target only the object's network owner.
- `fn update_display()` -- A regular function. Functions are called directly and run locally. They are useful for factoring out repeated logic that does not need to be a network event.
- `return` -- Exits the current event handler early, preventing further execution. Here it short-circuits the interaction once the game is over.

**Key concepts:**
- `sync none` replicates a variable to all clients with no interpolation.
- `event` defines a custom event that can be triggered with `send`.
- `send ... to All` broadcasts an event to every player in the instance.
- `fn` declares a local function for code reuse within a program.
- `return` provides early exit from an event handler.

## 4. Teleporter

Teleports the interacting player to a target location. Demonstrates accessing the local player, calling VRChat API methods, and using `Vector3` and `Quaternion` types.

```rust
pub let target_position: Vector3 = Vector3.zero
pub let target_rotation: Quaternion = Quaternion.identity

on Interact {
    let player: Player = localPlayer
    player.TeleportTo(target_position, target_rotation)
    log("Teleported!")
}
```

**How it works:**

- `pub let target_position: Vector3 = Vector3.zero` -- A public `Vector3` variable initialized to `(0, 0, 0)`. Because it is `pub`, you can set the exact teleport destination in the Unity Inspector by entering X, Y, and Z coordinates. `Vector3.zero` is a static property that returns the zero vector.
- `pub let target_rotation: Quaternion = Quaternion.identity` -- A public `Quaternion` for the player's facing direction after teleporting. `Quaternion.identity` means no rotation (facing the default direction). You can set this in the Inspector to control which way the player faces on arrival.
- `let player: Player = localPlayer` -- `localPlayer` is a built-in value that returns the `Player` object representing the person running this code. The `Player` type corresponds to VRChat's `VRCPlayerApi` and gives you access to methods like `TeleportTo`, `GetPosition`, and `IsOwner`.
- `player.TeleportTo(target_position, target_rotation)` -- Calls VRChat's teleport method on the local player. This instantly moves them to the target position and rotation. The method only works on the local player; you cannot teleport other players directly.
- `log("Teleported!")` -- Confirmation message in the console. This only appears on the teleported player's client.

**Key concepts:**
- `localPlayer` gives access to the player running the current code.
- The `Player` type wraps VRChat's `VRCPlayerApi` with its full set of methods.
- `Vector3` and `Quaternion` are Unity types for position and rotation.
- `pub let` with Unity types lets you configure positions and rotations in the Inspector.
- `TeleportTo` is a client-side operation that only affects the local player.

## 5. Game Timer

A countdown timer that syncs across all players and fires an event when time runs out. Demonstrates real-time countdowns, `RequestSerialization()` for manual sync, and combining multiple networking patterns.

```rust
pub let duration: float = 60.0
sync none time_remaining: float = 0.0
let is_running: bool = false

on Interact {
    if !is_running {
        time_remaining = duration
        is_running = true
        RequestSerialization()
        log("Timer started!")
    }
}

on Update {
    if is_running {
        time_remaining = time_remaining - Time.deltaTime
        if time_remaining <= 0.0 {
            time_remaining = 0.0
            is_running = false
            RequestSerialization()
            send TimerDone to All
        }
    }
}

event TimerDone {
    log("Time's up!")
}
```

**How it works:**

- `pub let duration: float = 60.0` -- The total countdown time in seconds, editable in the Inspector. Defaults to 60 seconds (one minute).
- `sync none time_remaining: float = 0.0` -- The current time left, synced across all players. Using `none` sync mode here means the value is transmitted exactly as-is. For a timer display, you might consider `linear` or `smooth` sync modes to interpolate between network updates for a smoother visual countdown on remote clients.
- `RequestSerialization()` -- Explicitly tells VRChat to send the current values of all synced variables to other players. This is necessary because Nori does not automatically serialize on every variable change. You should call it at meaningful moments: when the timer starts and when it finishes. Calling it every frame inside `on Update` would waste network bandwidth.
- `time_remaining = time_remaining - Time.deltaTime` -- Subtracts the elapsed frame time from the remaining time each frame. Because `Time.deltaTime` is measured in seconds, this produces a real-time countdown regardless of frame rate.
- `if time_remaining <= 0.0` -- When the countdown reaches zero, the timer stops itself by setting `is_running = false`, clamps the remaining time to exactly `0.0` to avoid negative values, syncs the final state, and broadcasts the `TimerDone` event to all players.
- `send TimerDone to All` -- Notifies every client that the timer has finished. Each client independently runs the `TimerDone` event handler, which could trigger game logic like ending a round, showing a UI, or playing a sound.
- The `if !is_running` guard in `on Interact` prevents players from restarting the timer while it is already counting down.

**Key concepts:**
- `RequestSerialization()` manually triggers network sync of all `sync` variables.
- Call `RequestSerialization()` at meaningful state transitions, not every frame.
- `Time.deltaTime` in `on Update` creates real-time countdowns and timers.
- Combine `sync` variables with `send ... to All` events for coordinated multiplayer logic.
- Guard clauses (`if !is_running`) prevent duplicate or conflicting actions.

## 6. Color-Changing Pickup

A pickup object that changes its material color to a random color each time the player presses the use button. Demonstrates constructor calls, GetComponent, and Material property access.

```rust
pub let target: GameObject = null
let target_material: Material = null

on Start {
    let renderer: MeshRenderer = target.GetComponent(MeshRenderer)
    target_material = renderer.material
}

on PickupUseDown {
    target_material.color = Color(Random.value, Random.value, Random.value, 1.0)
}
```

**How it works:**

- `pub let target: GameObject = null` -- A public reference to the GameObject whose color will change. Drag the target object into this field in the Inspector.
- `let target_material: Material = null` -- Stores the material reference, fetched once in `Start` to avoid repeated lookups.
- `target.GetComponent(MeshRenderer)` -- Retrieves the `MeshRenderer` component from the target GameObject. The type name `MeshRenderer` is passed directly (not as a string). The compiler resolves it to the correct Udon type reference.
- `renderer.material` -- Accesses the material assigned to the renderer. This is the instance material, so changes affect only this object.
- `Color(Random.value, Random.value, Random.value, 1.0)` -- Constructs a new `Color` value with random red, green, and blue components. `Random.value` returns a `float` between 0.0 and 1.0. The fourth argument is alpha (1.0 = fully opaque). This is a constructor call -- it looks like a function call but creates a new `Color` value.

**Key concepts:**
- Constructor calls like `Color(r, g, b, a)` create new value type instances.
- `GetComponent(TypeName)` retrieves components using a type argument, not a string.
- `Random.value` returns a random `float` between 0.0 and 1.0.
- Cache component references in `Start` instead of looking them up every frame.

## 7. Player Follower

An object that follows the local player's head position on the XZ plane, smoothly interpolating each frame. Demonstrates VR tracking data, constructor calls, and frame-rate-independent movement.

```rust
on Update {
    let tracking: TrackingData = localPlayer.GetTrackingData(TrackingDataType.Head)
    let head_pos: Vector3 = tracking.position
    let target_pos: Vector3 = Vector3(head_pos.x, 0.0, head_pos.z)
    transform.position = Vector3.Lerp(transform.position, target_pos, Time.deltaTime * 2.0)
}
```

**How it works:**

- `localPlayer.GetTrackingData(TrackingDataType.Head)` -- Gets the current tracking data for the local player's head. `TrackingDataType` is an enum with values `Head`, `LeftHand`, `RightHand`, and `Origin`. The method returns a `TrackingData` value containing both `position` and `rotation`.
- `tracking.position` -- Extracts the `Vector3` position from the tracking data. In VR, this is the real-world position of the player's headset. On desktop, it corresponds to the camera position.
- `Vector3(head_pos.x, 0.0, head_pos.z)` -- Constructs a new `Vector3` using the head's X and Z coordinates but with Y set to 0.0. This projects the position onto the ground plane so the follower stays at floor level.
- `Vector3.Lerp(transform.position, target_pos, Time.deltaTime * 2.0)` -- Linearly interpolates between the object's current position and the target. The `Time.deltaTime * 2.0` factor creates smooth movement that is frame-rate independent. Higher values make the object follow faster.

**Key concepts:**
- `TrackingDataType` is an enum for specifying which body part to track.
- `GetTrackingData()` returns a `TrackingData` value with `.position` and `.rotation` properties.
- `Vector3(x, y, z)` constructs a new vector from individual components.
- `Vector3.Lerp()` with `Time.deltaTime` creates smooth, frame-rate-independent movement.
- Projecting to the XZ plane (setting Y to 0.0) is a common pattern for ground-level following.
