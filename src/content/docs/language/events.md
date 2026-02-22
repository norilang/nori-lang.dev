---
title: Events
description: Built-in event handlers in Nori — lifecycle, interaction, player, collision, and serialization events.
sidebar:
  order: 7
---

Events are how your Nori program responds to things that happen in VRChat. When a player clicks an object, when the world loads, when a frame renders -- VRChat fires events, and your code handles them. Events are declared with the `on` keyword followed by the event name and a block of code.

## Declaring an event handler

```rust
on Start {
    log("World loaded!")
}
```

For events that provide data, declare parameters in parentheses:

```rust
on PlayerJoined(player: Player) {
    log("{player.displayName} joined!")
}
```

Each event handler is an entry point. When VRChat fires the event, execution begins at the first statement in the block and runs until the block ends or a `return` statement is reached.

## Event reference

### Lifecycle events

These fire during the Unity lifecycle of the GameObject:

| Event | Parameters | When it fires |
|-------|-----------|---------------|
| `Start` | -- | Once, when the UdonBehaviour initializes |
| `Enable` | -- | When the GameObject or UdonBehaviour is enabled |
| `Disable` | -- | When the GameObject or UdonBehaviour is disabled |
| `Update` | -- | Every frame |
| `LateUpdate` | -- | Every frame, after all `Update` calls |
| `FixedUpdate` | -- | Every physics step (fixed time interval) |
| `MouseDown` | -- | Mouse button pressed on the object's collider |
| `Destroy` | -- | The GameObject is being destroyed |

```rust
on Start {
    log("Initialized")
}

on Enable {
    log("Enabled")
}

on Disable {
    log("Disabled")
}

on Update {
    // runs every frame
    let dt: float = Time.deltaTime
}

on FixedUpdate {
    // runs at fixed physics rate
}
```

**Start** is the most common event. Use it to initialize state, set up references, and log diagnostic messages. It runs once when the UdonBehaviour first becomes active.

**Update** runs every frame and is where you put continuous logic like animations, timers, and input handling. Be mindful of performance -- code in `Update` runs 60-90 times per second.

**FixedUpdate** runs at a fixed interval (default 50 times per second) regardless of frame rate. Use it for physics-related logic.

**LateUpdate** runs after all `Update` calls have completed. Use it for camera follow logic or anything that needs to react to the results of `Update`.

### Interaction events

These fire when a player interacts with the GameObject:

| Event | Parameters | When it fires |
|-------|-----------|---------------|
| `Interact` | -- | Player clicks/triggers the object (requires a collider) |
| `Pickup` | -- | Player picks up the object (requires VRC_Pickup) |
| `Drop` | -- | Player drops the object |
| `PickupUseDown` | -- | Player presses use button while holding the object |
| `PickupUseUp` | -- | Player releases use button while holding the object |

```rust
on Interact {
    log("Clicked!")
}

on Pickup {
    log("Picked up")
}

on Drop {
    log("Dropped")
}

on PickupUseDown {
    log("Use button pressed")
}

on PickupUseUp {
    log("Use button released")
}
```

**Interact** is the most common interaction event. The GameObject must have a Collider component for interaction to work. In VRChat, players point at the object and click (desktop) or trigger (VR) to interact.

### Player events

These fire when players join or leave the instance:

| Event | Parameters | When it fires |
|-------|-----------|---------------|
| `PlayerJoined` | `player: Player` | A player joins the VRChat instance |
| `PlayerLeft` | `player: Player` | A player leaves the VRChat instance |

```rust
on PlayerJoined(player: Player) {
    log("{player.displayName} joined the world")
    if player.isLocal {
        log("That's me!")
    }
}

on PlayerLeft(player: Player) {
    log("{player.displayName} left the world")
}
```

`PlayerJoined` fires for every player already in the instance when you join, plus any new players who arrive later. The `player` parameter gives you access to the player's name, whether they are local or remote, and whether they are the instance master.

### Collision and trigger events

These fire during physics interactions:

| Event | Parameters | When it fires |
|-------|-----------|---------------|
| `TriggerEnter` | `other: Collider` | Another collider enters this object's trigger zone |
| `TriggerExit` | `other: Collider` | Another collider exits this object's trigger zone |
| `CollisionEnter` | `collision: Collision` | Another object collides with this object |
| `CollisionExit` | `collision: Collision` | Another object stops colliding with this object |

```rust
on TriggerEnter(other: Collider) {
    log("Something entered the trigger")
}

on TriggerExit(other: Collider) {
    log("Something left the trigger")
}

on CollisionEnter(collision: Collision) {
    log("Collision detected")
}
```

For trigger events, the GameObject must have a Collider component with the **Is Trigger** checkbox enabled.

### VRC player physics events

These fire when VRChat players interact with trigger zones or colliders:

| Event | Parameters | When it fires |
|-------|-----------|---------------|
| `PlayerTriggerEnter` | `player: Player` | A player enters this object's trigger zone |
| `PlayerTriggerExit` | `player: Player` | A player exits this object's trigger zone |
| `PlayerCollisionEnter` | `player: Player` | A player collides with this object |
| `PlayerCollisionExit` | `player: Player` | A player stops colliding with this object |
| `PlayerParticleCollision` | `player: Player` | A particle from this object hits a player |

```rust
on PlayerTriggerEnter(player: Player) {
    log("{player.displayName} entered the zone")
}

on PlayerTriggerExit(player: Player) {
    log("{player.displayName} left the zone")
}
```

These are VRChat-specific events that provide the `Player` who triggered the interaction, unlike the standard Unity collision events which provide `Collider` or `Collision` objects.

### Serialization events

These fire during variable synchronization across the network:

| Event | Parameters | When it fires |
|-------|-----------|---------------|
| `VariableChange` | -- | Synced variables have been updated from the network (fires on remote clients) |
| `PreSerialization` | -- | Just before synced variables are sent to the network (fires on the owner) |
| `PostSerialization` | `result: SerializationResult` | After serialization completes (fires on the owner) |
| `Deserialization` | -- | Synced variables have been updated from the network (alternative name for VariableChange) |
| `OwnershipRequest` | -- | Another player has requested ownership of this object |
| `OwnershipTransferred` | -- | Ownership of this object has been transferred to a new player |

```rust
on VariableChange {
    // synced variables just updated from the owner
    log("Received new data: score = {score}")
    update_display()
}

on PreSerialization {
    // about to send synced variables
    log("Sending data...")
}

on PostSerialization(result: SerializationResult) {
    log("Serialization complete")
}
```

`VariableChange` is the most commonly used serialization event. It fires on remote clients after synced variable values have been updated. Use it to react to state changes that the owner made. See [Networking](/language/networking/) for details.

### VRC feature events

These fire in response to VRChat-specific features:

| Event | Parameters | When it fires |
|-------|-----------|---------------|
| `VideoStart` | -- | A VRC video player on this object starts playback |
| `AvatarEyeHeightChanged` | -- | A player's avatar scale has changed |

### Download events

These fire when URL download operations complete. The compiler automatically injects a `result` parameter that you can access inside the handler:

| Event | Implicit parameter | When it fires |
|-------|-------------------|---------------|
| `StringLoadSuccess` | `result: IVRCStringDownload` | A string download completed successfully |
| `StringLoadError` | `result: IVRCStringDownload` | A string download failed |
| `ImageLoadSuccess` | `result: IVRCImageDownload` | An image download completed successfully |
| `ImageLoadError` | `result: IVRCImageDownload` | An image download failed |

```rust
pub let url: VRCUrl = null

on Start {
    VRCStringDownloader.LoadUrl(url)
}

on StringLoadSuccess {
    let text: string = result.Result
    log("Downloaded: {text}")
}

on StringLoadError {
    let err: string = result.Error
    error("Download failed: {err}")
}
```

Note: Unlike most events, download events do not declare their parameters in the event signature. The `result` variable is automatically available inside the handler body. The compiler handles the parameter injection.

## How events compile

Each event handler compiles to a labeled block in Udon Assembly. The label follows Udon's naming convention (for example, `Start` becomes `_start`, `PlayerJoined` becomes `_onPlayerJoined`). When VRChat fires an event, the VM jumps to the corresponding label and begins execution.

Each event block ends with a `JUMP` to address `0xFFFFFFFC`, the halt sentinel. This tells the Udon VM that the event handler is finished and control should return to VRChat.

Events are independent entry points. They do not call each other, and they do not return values. If you need shared logic between events, extract it into a [function](/language/functions/).

## Multiple handlers

You can only declare one handler per event name. Declaring two `on Start` blocks is an error:

```rust
// error: duplicate event handler
on Start {
    log("First")
}

on Start {
    log("Second")
}
```

## Events with parameters

Event parameters are module-level variables, just like all other variables in Nori. VRChat writes the parameter values into the heap variables before jumping to the event label. You declare them in the event signature:

```rust
on PlayerJoined(player: Player) {
    // 'player' is populated by VRChat before this code runs
}
```

The parameter names and types must match what VRChat expects. The compiler maps Nori names to the correct Udon parameter variable names.

## Common patterns

### Initialization in Start

```rust
pub let max_health: int = 100
let health: int = 0

on Start {
    health = max_health
    log("Game ready. Health: {health}")
}
```

### Frame-based animation in Update

```rust
let angle: float = 0.0
pub let rotation_speed: float = 45.0

on Update {
    angle = angle + rotation_speed * Time.deltaTime
    transform.Rotate(Vector3.up, rotation_speed * Time.deltaTime)
}
```

### Interaction with cooldown

```rust
let last_interact: float = 0.0
pub let cooldown: float = 1.0

on Interact {
    let now: float = Time.time
    if now - last_interact < cooldown {
        log("Please wait...")
        return
    }
    last_interact = now
    log("Activated!")
}
```

### Player tracking

```rust
let player_count: int = 0

on PlayerJoined(player: Player) {
    player_count = player_count + 1
    log("Players: {player_count}")
}

on PlayerLeft(player: Player) {
    player_count = player_count - 1
    log("Players: {player_count}")
}
```

## Common mistakes

**Using the wrong event name:**

```rust
// warning: unknown event name
on OnStart {
    log("Hello")
}

// correct
on Start {
    log("Hello")
}
```

Event names in Nori do not use the "On" prefix that Unity C# uses. It is `Start`, not `OnStart`. It is `Interact`, not `OnInteract`.

**Adding parentheses to parameterless events:**

```rust
// unnecessary but valid
on Start() {
    log("Hello")
}

// preferred
on Start {
    log("Hello")
}
```

**Putting heavy computation in Update:**

```rust
on Update {
    // runs every frame — avoid expensive operations here
    for i in 0..1000 {
        // this will cause lag
    }
}
```

Keep `Update` handlers lightweight. Move expensive operations to events that fire less frequently, or use a timer to throttle work.

## See also

- [Custom Events](/language/custom-events/) -- User-defined events with network capabilities
- [Functions](/language/functions/) -- Extract shared logic from event handlers
- [Networking](/language/networking/) -- Serialization events and synced variables
