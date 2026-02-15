---
title: Networking
description: Ownership, synced variables, serialization, and network events in Nori.
sidebar:
  order: 9
---

VRChat worlds are multiplayer by default. Every UdonBehaviour runs on every player's client, and the networking system keeps them in sync. Nori exposes VRChat's networking model through synced variables, ownership, serialization, and network events.

## The ownership model

Every GameObject in VRChat has an **owner** -- one player whose client is the authority for that object's synced state. Only the owner can write to synced variables and have those writes replicate to other players. When a non-owner writes to a synced variable, the change stays local and is overwritten on the next network update.

By default, the instance creator (master) owns all objects. Ownership can be transferred at runtime.

## Checking ownership

Use `Networking.IsOwner()` to check if the local player owns a GameObject:

```rust
on Interact {
    if Networking.IsOwner(localPlayer, gameObject) {
        log("I own this object")
    } else {
        log("Someone else owns this")
    }
}
```

The `localPlayer` shortcut is always available and refers to `Networking.LocalPlayer` (the local `Player` instance).

## Transferring ownership

Use `Networking.SetOwner()` to transfer ownership to a player:

```rust
on Interact {
    if !Networking.IsOwner(localPlayer, gameObject) {
        Networking.SetOwner(localPlayer, gameObject)
    }
}
```

Ownership transfer is not instant -- it takes a network round-trip. After calling `SetOwner`, wait for the transfer to complete before modifying synced variables. A common pattern is to request ownership and then modify state in a subsequent event.

## Synced variables

Declare synced variables with the `sync` keyword followed by a sync mode:

```rust
sync none score: int = 0
sync linear position_x: float = 0.0
sync smooth rotation_y: float = 0.0
```

### Sync modes

| Mode | Behavior | Best for |
|------|----------|----------|
| `none` | Value jumps to the new value on each network update. No interpolation. | Discrete state: scores, booleans, IDs, strings |
| `linear` | Linearly interpolates between old and new values over time. | Values that change at a constant rate: timers, counters |
| `smooth` | Smoothly interpolates with easing. | Positions, rotations, continuous motion |

### Which types can be synced

Synced variables work with types that Udon supports for network serialization. The commonly used syncable types are:

- `bool`
- `int`, `uint`
- `float`, `double`
- `string`
- `Vector2`, `Vector3`, `Vector4`
- `Quaternion`
- `Color`, `Color32`

Arrays and reference types (GameObjects, Players, etc.) cannot be synced.

## Requesting serialization

After modifying a synced variable, you must call `RequestSerialization()` to tell VRChat to send the updated values to other clients:

```rust
sync none score: int = 0

on Interact {
    if Networking.IsOwner(localPlayer, gameObject) {
        score = score + 1
        RequestSerialization()
    }
}
```

Without `RequestSerialization()`, the variable will eventually sync on VRChat's default schedule, but calling it explicitly ensures timely delivery.

## Receiving synced data

When synced variable values arrive from the network on a remote client, VRChat fires the `VariableChange` event:

```rust
on VariableChange {
    log("Score updated to: {score}")
    update_display()
}
```

`VariableChange` only fires on **remote** clients -- not on the owner. The owner already has the current values because they wrote them. Use `VariableChange` to update UI, play effects, or react to state changes made by the owner.

## Network events

Custom events can be sent over the network using `send ... to All` or `send ... to Owner`:

```rust
event PlayEffect {
    log("Playing effect!")
}

on Interact {
    send PlayEffect to All    // runs on every client
}
```

```rust
event OwnerGrantPoint {
    if Networking.IsOwner(localPlayer, gameObject) {
        score = score + 1
        RequestSerialization()
    }
}

on Interact {
    send OwnerGrantPoint to Owner   // runs only on the owner's client
}
```

Network events are asynchronous. There is latency between when the event is sent and when remote clients execute it. See [Custom Events](/language/custom-events/) for details.

## The localPlayer shortcut

`localPlayer` is a built-in shortcut that refers to `Networking.LocalPlayer`, the local player's `Player` instance. It is always available without any declaration:

```rust
on Start {
    log("My name is {localPlayer.displayName}")
    if localPlayer.isMaster {
        log("I am the instance master")
    }
}
```

## Full networking example

Here is a complete example of a networked scoreboard:

```rust
pub let max_score: int = 10
sync none score: int = 0
sync none is_game_over: bool = false

fn update_display() {
    log("Score: {score}/{max_score}")
}

on Start {
    update_display()
}

// only the owner should modify synced state
event OwnerAddPoint {
    if Networking.IsOwner(localPlayer, gameObject) {
        if !is_game_over {
            score = score + 1
            if score >= max_score {
                is_game_over = true
            }
            RequestSerialization()
        }
    }
}

// any player can click to request a point
on Interact {
    if is_game_over {
        log("Game is over!")
        return
    }
    send OwnerAddPoint to Owner
}

// remote clients react to synced variable changes
on VariableChange {
    update_display()
    if is_game_over {
        log("Game over! Final score: {score}")
    }
}

// reset game (owner only)
event OwnerReset {
    if Networking.IsOwner(localPlayer, gameObject) {
        score = 0
        is_game_over = false
        RequestSerialization()
    }
}
```

## Common patterns

### Ownership check before modification

```rust
on Interact {
    if !Networking.IsOwner(localPlayer, gameObject) {
        Networking.SetOwner(localPlayer, gameObject)
    }
    // After ownership is acquired (may need to wait)
    sync_value = sync_value + 1
    RequestSerialization()
}
```

### Take ownership, then act

A more robust pattern separates ownership transfer from state modification:

```rust
let wants_to_interact: bool = false

on Interact {
    if Networking.IsOwner(localPlayer, gameObject) {
        do_interact()
    } else {
        wants_to_interact = true
        Networking.SetOwner(localPlayer, gameObject)
    }
}

fn do_interact() {
    is_toggled = !is_toggled
    RequestSerialization()
}
```

### Networked toggle

```rust
sync none is_active: bool = false

event ToggleState {
    is_active = !is_active
    RequestSerialization()
}

on Interact {
    if Networking.IsOwner(localPlayer, gameObject) {
        send ToggleState
    } else {
        Networking.SetOwner(localPlayer, gameObject)
        send ToggleState
    }
}

on VariableChange {
    gameObject.SetActive(is_active)
}
```

### Master-only logic

```rust
on Start {
    if localPlayer.isMaster {
        log("I am the master, initializing world state")
        send InitializeWorld
    }
}

event InitializeWorld {
    score = 0
    timer = 300.0
    RequestSerialization()
}
```

## Common mistakes

**Forgetting `RequestSerialization()`:**

```rust
on Interact {
    score = score + 1
    // oops: forgot RequestSerialization()
    // other players won't see the change promptly
}
```

Always call `RequestSerialization()` after modifying synced variables if you want the changes sent immediately.

**Writing synced variables without ownership:**

```rust
sync none score: int = 0

on Interact {
    score = score + 1           // only works if we're the owner
    RequestSerialization()
}
```

If the local player is not the owner, the write will be overwritten on the next network update. Always check or acquire ownership first:

```rust
on Interact {
    if Networking.IsOwner(localPlayer, gameObject) {
        score = score + 1
        RequestSerialization()
    }
}
```

**Expecting `VariableChange` to fire on the owner:**

```rust
on VariableChange {
    // this only fires on REMOTE clients, not the owner
    update_display()
}
```

If the owner also needs to update the display, call the update function directly after modifying the variable:

```rust
on Interact {
    if Networking.IsOwner(localPlayer, gameObject) {
        score = score + 1
        RequestSerialization()
        update_display()   // owner updates locally
    }
}

on VariableChange {
    update_display()       // remote clients update from network
}
```

**Expecting instant ownership transfer:**

```rust
on Interact {
    Networking.SetOwner(localPlayer, gameObject)
    // ownership may not have transferred yet!
    score = score + 1   // might get overwritten
}
```

Ownership transfer involves a network round-trip. Design your code to handle the delay.

## See also

- [Variables](/language/variables/) -- `sync` variable declarations
- [Custom Events](/language/custom-events/) -- `send ... to All|Owner` syntax
- [Events](/language/events/) -- `VariableChange`, `PreSerialization`, `PostSerialization`
- [Limitations](/language/limitations/) -- Networking constraints and workarounds
