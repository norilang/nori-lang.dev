---
title: Custom Events
description: Define and send custom events — local calls and networked events in Nori.
sidebar:
  order: 8
---

Custom events are user-defined blocks of logic that can be triggered locally or sent over the network to other clients. They bridge the gap between functions (which are local-only) and VRChat's networked event system.

## Defining a custom event

Use the `event` keyword followed by a name and a block of code:

```rust
event ScoreChanged {
    log("Score is now {score}")
    update_display()
}

event ResetGame {
    score = 0
    is_game_over = false
    log("Game reset!")
}
```

Custom event names must be unique within the file. They follow the same naming rules as variables and functions.

## Sending a custom event

### Local send

Use `send` to trigger a custom event locally on this UdonBehaviour:

```rust
send ScoreChanged
```

This is equivalent to Udon's `SendCustomEvent`. The event runs immediately on the local client, similar to calling a function.

```rust
event UpdateDisplay {
    log("Health: {health} | Score: {score}")
}

on Start {
    send UpdateDisplay
}

on Interact {
    score = score + 1
    send UpdateDisplay
}
```

### Network send to all clients

Use `send ... to All` to trigger the event on every client in the VRChat instance, including the sender:

```rust
send GameOver to All
```

This uses Udon's `SendCustomNetworkEvent` with the `All` target. The event will fire on every player's copy of this UdonBehaviour.

```rust
sync none score: int = 0

event AddPoint {
    score = score + 1
    log("Score: {score}")
}

on Interact {
    send AddPoint to All
}
```

### Network send to owner

Use `send ... to Owner` to trigger the event only on the client that owns the GameObject:

```rust
send RequestUpdate to Owner
```

This uses `SendCustomNetworkEvent` with the `Owner` target. Only the owner of the GameObject will execute the event body.

```rust
event OwnerDoUpdate {
    // only the owner executes this
    sync_value = sync_value + 1
    RequestSerialization()
}

on Interact {
    send OwnerDoUpdate to Owner
}
```

## Custom events vs. functions

Custom events and functions both encapsulate reusable logic, but they serve different purposes:

| Feature | `fn` function | `event` custom event |
|---------|--------------|---------------------|
| Local call | `my_function()` | `send MyEvent` |
| Network call | Not possible | `send MyEvent to All\|Owner` |
| Parameters | Yes | No |
| Return value | Yes | No |
| Udon output | Internal label with `JUMP_INDIRECT` | Exported label (plain name) |

Use **functions** for local logic that needs parameters or return values. Use **custom events** when you need to trigger logic over the network.

### Exported labels

Custom events produce exported Udon labels with their plain name (not prefixed with an underscore). This is what allows VRChat's networking system to find and invoke them. Built-in events like `Start` compile to underscore-prefixed labels (`_start`), but custom events use their name directly.

```rust
event MyEvent {
    // compiles to label "MyEvent" in Udon Assembly
}
```

## Combining custom events and functions

A common pattern is to define a custom event that calls a function for the actual logic:

```rust
fn do_update_display() {
    log("Score: {score} | Health: {health}")
}

event RefreshUI {
    do_update_display()
}

on Start {
    do_update_display()    // call directly when local
}

on Interact {
    send RefreshUI to All  // trigger on all clients
}
```

This gives you the flexibility of functions (parameters, return values, direct calls) with the network capability of custom events.

## Error handling

### Invalid send target (E0020)

The `to` target must be either `All` or `Owner`:

```rust
// error E0020: Invalid send target
send MyEvent to Everyone

// correct
send MyEvent to All
send MyEvent to Owner
```

### Undefined custom event (E0071)

You can only send events that are defined in the same file:

```rust
// error E0071: Undefined custom event 'DoStuff'
send DoStuff

// fix: define the event
event DoStuff {
    log("Doing stuff")
}
send DoStuff
```

## Common patterns

### Networked toggle

```rust
sync none is_on: bool = false

event Toggle {
    is_on = !is_on
    log("Toggled: {is_on}")
}

on Interact {
    send Toggle to All
}
```

### Owner-authoritative action

```rust
sync none score: int = 0

event OwnerAddPoint {
    if Networking.IsOwner(localPlayer, gameObject) {
        score = score + 1
        RequestSerialization()
    }
}

on Interact {
    send OwnerAddPoint to Owner
}

on VariableChange {
    log("Score updated: {score}")
}
```

### Game state transitions

```rust
sync none game_state: int = 0

event StartGame {
    game_state = 1
    score = 0
    timer = 60.0
    log("Game started!")
}

event EndGame {
    game_state = 2
    log("Game over! Final score: {score}")
}

on Interact {
    if game_state == 0 {
        send StartGame to All
    }
}

on Update {
    if game_state == 1 {
        timer = timer - Time.deltaTime
        if timer <= 0.0 {
            send EndGame to All
        }
    }
}
```

### Chained events

```rust
event StepOne {
    log("Step 1 complete")
    send StepTwo
}

event StepTwo {
    log("Step 2 complete")
    send StepThree
}

event StepThree {
    log("All steps done!")
}

on Interact {
    send StepOne
}
```

## Common mistakes

**Trying to pass parameters to custom events:**

```rust
// error: custom events do not take parameters
event Damage(amount: int) {
    health = health - amount
}
```

Custom events cannot have parameters. Use a module-level variable to pass data:

```rust
let pending_damage: int = 0

event ApplyDamage {
    health = health - pending_damage
}

fn deal_damage(amount: int) {
    pending_damage = amount
    send ApplyDamage
}
```

**Confusing `send` with a function call:**

```rust
// wrong: this tries to call a function named MyEvent
MyEvent()

// correct: use send for custom events
send MyEvent
```

**Forgetting that network events are asynchronous:**

```rust
on Interact {
    send UpdateScore to All
    // code here runs immediately on the local client
    // the remote clients have NOT received the event yet
    log("Sent!")
}
```

Network sends are not instantaneous. There will be latency before remote clients execute the event.

## See also

- [Functions](/language/functions/) -- Local logic with parameters and return values
- [Events](/language/events/) -- Built-in VRChat event handlers
- [Networking](/language/networking/) -- Ownership, synced variables, and the full networking model
