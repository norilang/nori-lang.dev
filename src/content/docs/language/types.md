---
title: Types
description: Nori's type system — primitives, arrays, Unity types, and VRChat types.
sidebar:
  order: 3
---

Nori's type system maps directly to the types available in VRChat's Udon VM. Every Nori type has a corresponding Udon type name that the compiler uses when generating assembly. There are no user-defined types, no generics, and no type inference.

## Primitive types

| Nori type | Udon type | Description | Example literal |
|-----------|-----------|-------------|-----------------|
| `bool` | `SystemBoolean` | True or false | `true`, `false` |
| `int` | `SystemInt32` | 32-bit signed integer | `42`, `-7`, `0` |
| `uint` | `SystemUInt32` | 32-bit unsigned integer | `0` |
| `float` | `SystemSingle` | 32-bit floating point | `3.14`, `0.0`, `-1.5` |
| `double` | `SystemDouble` | 64-bit floating point | `0.0` |
| `string` | `SystemString` | Text | `"hello"`, `""` |
| `char` | `SystemChar` | Single character | -- |
| `object` | `SystemObject` | Base type for all objects | `null` |
| `void` | `SystemVoid` | No value (return type only) | -- |

The most commonly used primitives are `bool`, `int`, `float`, and `string`. Use `float` for most decimal numbers -- it matches Unity's conventions and most Udon externs expect `SystemSingle`.

## Unity types

| Nori type | Udon type | Description |
|-----------|-----------|-------------|
| `Vector2` | `UnityEngineVector2` | 2D vector (x, y) |
| `Vector3` | `UnityEngineVector3` | 3D vector (x, y, z) |
| `Vector4` | `UnityEngineVector4` | 4D vector (x, y, z, w) |
| `Quaternion` | `UnityEngineQuaternion` | Rotation |
| `Color` | `UnityEngineColor` | RGBA color (float components) |
| `Color32` | `UnityEngineColor32` | RGBA color (byte components) |
| `Transform` | `UnityEngineTransform` | Position, rotation, and scale of a GameObject |
| `GameObject` | `UnityEngineGameObject` | A Unity scene object |
| `Rigidbody` | `UnityEngineRigidbody` | Physics body |
| `Collider` | `UnityEngineCollider` | Physics collider |
| `MeshRenderer` | `UnityEngineMeshRenderer` | Mesh rendering component |
| `AudioSource` | `UnityEngineAudioSource` | Audio playback component |
| `Animator` | `UnityEngineAnimator` | Animation controller |
| `Collision` | `UnityEngineCollision` | Collision event data |
| `Material` | `UnityEngineMaterial` | Material for rendering (color, shader properties) |
| `Renderer` | `UnityEngineRenderer` | Base renderer component |
| `LineRenderer` | `UnityEngineLineRenderer` | Renders lines in 3D space |
| `ConstantForce` | `UnityEngineConstantForce` | Applies constant physics force |
| `Component` | `UnityEngineComponent` | Base class for all components |

## VRChat types

| Nori type | Udon type | Description |
|-----------|-----------|-------------|
| `Player` | `VRCSDKBaseVRCPlayerApi` | A VRChat player. Use `localPlayer` for the local player. |
| `SerializationResult` | `VRCSDKBaseVRCSerializationResult` | Result of a serialization operation |
| `UdonBehaviour` | `VRCUdonUdonBehaviour` | A reference to another UdonBehaviour |
| `VRCObjectPool` | `VRCSDK3ComponentsVRCObjectPool` | Pool of reusable GameObjects |
| `VRCObjectSync` | `VRCSDK3ComponentsVRCObjectSync` | Syncs object position/rotation across network |
| `VRCAvatarPedestal` | `VRCSDK3ComponentsVRCAvatarPedestal` | Avatar pedestal for trying avatars |
| `VRCPickup` | `VRCSDK3ComponentsVRCPickup` | Pickupable object component |
| `VRCVideoPlayer` | `VRCSDK3VideoComponentsBaseBaseVRCVideoPlayer` | Video player component |
| `VRCUrlInputField` | `VRCSDK3ComponentsVRCUrlInputField` | URL input field component |
| `VRCUrl` | `VRCSDKBaseVRCUrl` | URL value type for video/download URLs |
| `VRCImageDownloader` | `VRCSDK3ImageVRCImageDownloader` | Downloads images from URLs |
| `TextureInfo` | `VRCSDK3ImageTextureInfo` | Texture download configuration |
| `TrackingData` | `VRCSDKBaseVRCPlayerApiTrackingData` | VR tracking position and rotation data |
| `IVRCStringDownload` | `VRCSDK3StringLoadingIVRCStringDownload` | String download result (has `.Result`, `.Error`, `.ErrorCode` properties) |
| `IVRCImageDownload` | `VRCSDK3ImageIVRCImageDownload` | Image download result (has `.Error`, `.ErrorMessage` properties) |

`Player` is the type you will use most often for VRChat-specific logic. It provides properties like `displayName`, `isLocal`, and `isMaster`.

## UI types

Unity's built-in UI components are available for creating in-world interfaces:

| Nori type | Udon type | Key property | Description |
|-----------|-----------|--------------|-------------|
| `UIText` | `UnityEngineUIText` | `.text: string` | Displays text in the UI |
| `UIToggle` | `UnityEngineUIToggle` | `.isOn: bool` | Checkbox / toggle switch |
| `UISlider` | `UnityEngineUISlider` | `.value: float` | Numeric slider (0.0 to 1.0 by default) |
| `UIDropdown` | `UnityEngineUIDropdown` | `.value: int` | Dropdown menu (value is the selected index) |
| `UIInputField` | `UnityEngineUIInputField` | `.text: string` | Text input field |

```rust
pub let label: UIText = null
pub let volume_slider: UISlider = null

on Start {
    label.text = "Hello!"
    let vol: float = volume_slider.value
    log("Volume: {vol}")
}
```

These correspond to Unity's `UnityEngine.UI` namespace. Drag UI components from your Canvas into the Inspector fields.

## Enum types

Nori supports several built-in enum types from Unity and VRChat. Access enum values using the `Type.Value` syntax:

| Nori type | Values | Description |
|-----------|--------|-------------|
| `KeyCode` | `KeyCode.Space`, `KeyCode.W`, `KeyCode.Return`, `KeyCode.Escape`, ... | Keyboard key constants |
| `TrackingDataType` | `TrackingDataType.Head`, `.LeftHand`, `.RightHand`, `.Origin` | VR tracking points |
| `PickupHand` | `PickupHand.Left`, `PickupHand.Right` | VR hand identifier |

```rust
on Update {
    if Input.GetKeyDown(KeyCode.Space) {
        log("Space pressed!")
    }
}
```

```rust
on Update {
    let tracking: TrackingData = localPlayer.GetTrackingData(TrackingDataType.Head)
    let head_pos: Vector3 = tracking.position
    log("Head at: {head_pos}")
}
```

You cannot define your own enum types in Nori. Only the enums recognized by the Udon VM are available.

## Array types

Arrays are the only collection type available in Nori. Declare an array by adding `[]` after the element type:

```rust
let scores: int[] = null
let names: string[] = null
let positions: Vector3[] = null
pub let targets: GameObject[] = null
```

The Nori type `int[]` maps to the Udon type `SystemInt32Array`. The pattern is consistent: `type[]` becomes `{UdonType}Array`.

### Array operations

Access elements by index and get the length:

```rust
let items: string[] = null

on Start {
    let first: string = items[0]
    let count: int = items.Length
    log("First item: {first}, total: {count}")
}
```

Set elements by index:

```rust
let values: int[] = null

on Start {
    values[0] = 42
    values[1] = 100
}
```

Create arrays with array literal syntax:

```rust
let primes: int[] = [2, 3, 5, 7, 11]
let greetings: string[] = ["hello", "world"]
```

Iterate over arrays with `for..in`:

```rust
let names: string[] = ["Alice", "Bob", "Charlie"]

on Start {
    for name in names {
        log("Hello, {name}!")
    }
}
```

## Static types

Some types are used only for their static properties and methods. You never create instances of these types -- you access them directly by name:

| Type | Description | Example |
|------|-------------|---------|
| `Time` | Frame timing | `Time.deltaTime`, `Time.time` |
| `Networking` | VRChat networking | `Networking.LocalPlayer`, `Networking.IsOwner()` |
| `Mathf` | Math functions | `Mathf.Abs()`, `Mathf.Lerp()`, `Mathf.Clamp()` |
| `Physics` | Physics queries | `Physics.Raycast()` |
| `Vector3` | Vector3 statics | `Vector3.zero`, `Vector3.Lerp()`, `Vector3.Distance()` |
| `Vector2` | Vector2 statics | `Vector2.zero` |
| `Vector4` | Vector4 statics | -- |
| `Quaternion` | Quaternion statics | `Quaternion.identity` |
| `Color` | Color statics | -- |
| `Random` | Random values | `Random.value`, `Random.Range()`, `Random.ColorHSV()` |
| `Input` | Keyboard input | `Input.GetKeyDown()`, `Input.GetKey()`, `Input.GetKeyUp()` |
| `String` | String utilities | `String.Format()`, `String.Concat()` |
| `Utilities` | VRChat utilities | `Utilities.IsValid()` |
| `VRCPlayerApi` | Player API statics | `VRCPlayerApi.GetPlayers()` |
| `VRCStringDownloader` | String downloads | `VRCStringDownloader.LoadUrl()` |

```rust
on Update {
    let dt: float = Time.deltaTime
    let pos: Vector3 = transform.position
    let dist: float = Vector3.Distance(pos, Vector3.zero)
    log("Distance from origin: {dist}")
}
```

## Implicit conversions

Nori supports three implicit type conversions. These happen automatically when assigning or passing values:

| From | To | Example |
|------|----|---------|
| `int` | `float` | `let f: float = 42` -- the `int` 42 is converted to `float` |
| `int` | `double` | `let d: double = 42` -- the `int` 42 is converted to `double` |
| `float` | `double` | `let d: double = 3.14` -- the `float` 3.14 is converted to `double` |

These conversions also apply to operator operands. If you write `5 * 2.0`, the `int` 5 is widened to `float` before the multiplication.

All other type mismatches produce a compile error ([E0040](/errors/E0040/)).

## What is NOT supported

### Generics

Nori does not support generic types like `List<T>` or `Dictionary<K,V>`. Udon's type system is based on concrete .NET types exposed through the extern whitelist, and .NET generics are not part of that whitelist.

Use typed arrays instead:

```rust
// Instead of List<int>:
let scores: int[] = [0, 0, 0, 0, 0]

// Instead of List<string>:
let names: string[] = null
```

See [E0042](/errors/E0042/) for more details.

### User-defined types

There are no classes, structs, interfaces, or enums that you can define in Nori. Udon has no mechanism for user-defined types. If you need to group related data, use parallel arrays or multiple variables:

```rust
// Instead of a Player struct:
let player_names: string[] = null
let player_scores: int[] = null
let player_alive: bool[] = null
```

### Nullable types

There is no `int?` or `bool?` syntax. Primitive types always have a value. Reference types (GameObjects, Players, etc.) can be `null`.

### Type inference

Nori requires explicit type annotations on all declarations. There is no `var` or `auto` keyword:

```rust
let x: int = 5       // correct
let x = 5            // error
```

## Common patterns

### Type-safe references

```rust
pub let door: GameObject = null
pub let audio: AudioSource = null
pub let spawn_point: Transform = null
```

Assign these in the Unity Inspector by dragging objects into the fields.

### Working with vectors

```rust
let velocity: Vector3 = Vector3.zero

on Update {
    velocity = Vector3.Lerp(velocity, Vector3.zero, Time.deltaTime)
    transform.position = transform.position + velocity * Time.deltaTime
}
```

## See also

- [Variables](/language/variables/) -- How to declare variables with types
- [Expressions](/language/expressions/) -- Operators that work on these types
- [Limitations](/language/limitations/) -- Full list of unsupported features and why
