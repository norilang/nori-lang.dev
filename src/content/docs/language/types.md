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

## VRChat types

| Nori type | Udon type | Description |
|-----------|-----------|-------------|
| `Player` | `VRCSDKBaseVRCPlayerApi` | A VRChat player. Use `localPlayer` for the local player. |
| `SerializationResult` | `VRCSDKBaseVRCSerializationResult` | Result of a serialization operation |
| `UdonBehaviour` | `VRCUdonUdonBehaviour` | A reference to another UdonBehaviour |

`Player` is the type you will use most often for VRChat-specific logic. It provides properties like `displayName`, `isLocal`, and `isMaster`.

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
