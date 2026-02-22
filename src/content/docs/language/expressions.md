---
title: Expressions
description: Operators, member access, indexing, string interpolation, and array literals in Nori.
sidebar:
  order: 4
---

Expressions in Nori produce values. They include literals, variable references, operators, method calls, property access, indexing, string interpolation, and array literals. Every expression has a resolved type that the compiler determines during semantic analysis.

## Operator precedence

Operators are listed from highest precedence (binds tightest) to lowest:

| Precedence | Operators | Description | Associativity |
|------------|-----------|-------------|---------------|
| 1 | `!`, `-` (unary) | Logical NOT, negation | Right |
| 2 | `*`, `/`, `%` | Multiplication, division, modulo | Left |
| 3 | `+`, `-` | Addition, subtraction | Left |
| 4 | `<`, `>`, `<=`, `>=` | Comparison | Left |
| 5 | `==`, `!=` | Equality | Left |
| 6 | `..` | Range | Left |
| 7 | `&&` | Logical AND | Left |
| 8 | `\|\|` | Logical OR | Left |

Use parentheses to override precedence:

```rust
let result: bool = (a + b) > (c * d)
let combined: bool = (x > 0) && (y < 10)
```

## Arithmetic operators

```rust
let sum: int = a + b        // addition
let diff: int = a - b       // subtraction
let product: int = a * b    // multiplication
let quotient: int = a / b   // division
let remainder: int = a % b  // modulo
let neg: int = -a            // unary negation
```

Arithmetic operators work on `int`, `float`, and `Vector3` values. When mixing `int` and `float` in the same expression, the `int` operand is implicitly widened to `float`:

```rust
let x: int = 5
let y: float = 2.0
let result: float = x * y   // x is widened to float, result is float
```

Vector3 supports addition, subtraction, and scalar multiplication:

```rust
let a: Vector3 = Vector3.up
let b: Vector3 = Vector3.right
let c: Vector3 = a + b               // Vector3 + Vector3
let d: Vector3 = a - b               // Vector3 - Vector3
let e: Vector3 = a * 2.0             // Vector3 * float
let f: Vector3 = 3.0 * b             // float * Vector3
```

## Comparison operators

```rust
let greater: bool = a > b
let less: bool = a < b
let gte: bool = a >= b
let lte: bool = a <= b
```

Comparison operators work on numeric types (`int`, `float`) and return `bool`.

## Equality operators

```rust
let same: bool = a == b
let different: bool = a != b
```

Equality works on `int`, `float`, `bool`, and `string` values.

## Logical operators

```rust
let both: bool = a && b     // logical AND
let either: bool = a || b   // logical OR
let nope: bool = !a         // logical NOT
```

Both operands of `&&` and `||` must be `bool`.

**Important:** Nori does not short-circuit `&&` and `||`. Both sides of the expression are always evaluated. This means that a guard pattern like `obj != null && obj.IsActive()` will evaluate `obj.IsActive()` even when `obj` is `null`. Use nested `if` statements instead:

```rust
// WRONG: both sides always evaluate
if obj != null && obj.activeSelf {
    // ...
}

// CORRECT: use nested if for null guards
if obj != null {
    if obj.activeSelf {
        // ...
    }
}
```

## Assignment operators

```rust
x = 10           // simple assignment
x += 5           // add and assign (x = x + 5)
x -= 3           // subtract and assign (x = x - 3)
x *= 2           // multiply and assign (x = x * 2)
x /= 4           // divide and assign (x = x / 4)
```

Compound assignment operators (`+=`, `-=`, `*=`, `/=`) are shorthand. They read the current value, apply the operation, and write the result back.

## Member access

Use dot syntax to access properties and call methods on objects:

```rust
// Properties
let pos: Vector3 = transform.position
let name: string = player.displayName
let active: bool = gameObject.activeSelf

// Methods
gameObject.SetActive(false)
transform.Rotate(Vector3.up, 45.0)
```

### Static member access

Access static properties and methods through the type name:

```rust
let dt: float = Time.deltaTime
let t: float = Time.time

let dist: float = Vector3.Distance(pos1, pos2)
let mid: Vector3 = Vector3.Lerp(start, end, 0.5)

let clamped: float = Mathf.Clamp(value, 0.0, 1.0)
let abs: float = Mathf.Abs(x)
```

## Indexing

Access array elements with bracket syntax:

```rust
let first: int = scores[0]
let last: int = scores[scores.Length - 1]

scores[0] = 100
```

The index expression must be an `int`. Indices are zero-based.

## String interpolation

Embed expressions inside string literals using curly braces:

```rust
let name: string = "World"
log("Hello, {name}!")

let score: int = 42
log("Score: {score}")

let pos: Vector3 = transform.position
log("Position: {pos}")
```

Any expression can appear inside the braces. The expression is converted to a string and concatenated into the result:

```rust
log("Health: {current_hp}/{max_hp}")
log("Distance: {Vector3.Distance(a, b)}")
log("{player.displayName} scored {points} points")
```

String interpolation produces a `string` value. You can assign it to a variable or pass it as an argument:

```rust
let msg: string = "Player {name} has {score} points"
```

## String concatenation

You can also concatenate strings with the `+` operator:

```rust
let greeting: string = "Hello, " + name + "!"
```

String interpolation is generally preferred for readability.

## Array literals

Create arrays inline with bracket syntax:

```rust
let numbers: int[] = [1, 2, 3, 4, 5]
let names: string[] = ["Alice", "Bob", "Charlie"]
let flags: bool[] = [true, false, true]
```

All elements must be the same type. The resulting array type is inferred from the elements.

## Range expressions

The `..` operator creates a range, used exclusively in `for..in` loops:

```rust
for i in 0..10 {
    log("Index: {i}")
}
```

The range `0..10` produces values from 0 up to but not including 10. See [Control Flow](/language/control-flow/) for details.

## Cast expressions

Use the `as` keyword to explicitly convert between numeric types:

```rust
let server_time: double = Networking.GetServerTimeInSeconds()
let t: float = server_time as float
```

Cast expressions convert between `int`, `float`, and `double`. This is useful when a method returns a wider type than you need:

```rust
let big: double = 3.14159
let small: float = big as float
let whole: int = small as int
```

Casts between incompatible types (e.g., `string as int`) produce a compile error.

## Constructor calls

Create new instances of value types by calling the type name as a function:

```rust
let c: Color = Color(0.3, 1.0, 0.0, 1.0)
let v: Vector3 = Vector3(1.0, 2.0, 3.0)
```

The following constructors are available:

| Constructor | Parameters | Description |
|-------------|-----------|-------------|
| `Color(r, g, b, a)` | Four `float` values | RGBA color (each 0.0 to 1.0) |
| `Vector2(x, y)` | Two `float` values | 2D vector |
| `Vector3(x, y, z)` | Three `float` values | 3D vector |
| `Vector4(x, y, z, w)` | Four `float` values | 4D vector |
| `Quaternion(x, y, z, w)` | Four `float` values | Rotation quaternion |

```rust
let red: Color = Color(1.0, 0.0, 0.0, 1.0)
let origin: Vector3 = Vector3(0.0, 0.0, 0.0)
let offset: Vector2 = Vector2(0.5, 0.5)
```

Note: These look like function calls but are compiled to constructor externs. You cannot construct arbitrary types -- only the value types listed above.

## GetComponent

Retrieve components from GameObjects by passing a type name as the argument:

```rust
let renderer: MeshRenderer = gameObject.GetComponent(MeshRenderer)
let line: LineRenderer = gameObject.GetComponent(LineRenderer)
```

The type argument is not a string -- it is the actual type name. The compiler resolves it to the correct Udon type reference. The return type is `Component`, so you typically assign the result to a variable of the specific component type.

`GetComponentsInChildren` works the same way and returns a `Component[]` array.

## Array construction

Create arrays of a specific size using the type-and-size syntax:

```rust
let flags: bool[] = bool[10]
let positions: Vector3[] = Vector3[50]
let names: string[] = string[5]
```

This creates an array of the given type with the specified number of elements. All elements are initialized to their default value (`false` for `bool`, `0` for `int`, `null` for reference types).

## Built-in shortcuts

Nori provides several shortcuts that are always available without any declaration:

| Shortcut | Equivalent to | Type |
|----------|---------------|------|
| `localPlayer` | `Networking.LocalPlayer` | `Player` |
| `gameObject` | The UdonBehaviour's GameObject | `GameObject` |
| `transform` | `gameObject.transform` | `Transform` |
| `log(value)` | `Debug.Log(value)` | void |
| `warn(value)` | `Debug.LogWarning(value)` | void |
| `error(value)` | `Debug.LogError(value)` | void |
| `IsValid(reference)` | `Utilities.IsValid(reference)` | `bool` |
| `SendCustomEventDelayedSeconds(name, delay, timing)` | Sends a custom event after a delay | `void` |

```rust
on Start {
    log("Hello from {localPlayer.displayName}")
    log("My position: {transform.position}")
    gameObject.SetActive(true)
}
```

## Null literal

The `null` literal represents the absence of a reference. It can be assigned to any reference type:

```rust
let obj: GameObject = null
let player: Player = null
```

## Common patterns

### Chained property access

```rust
let player_pos: Vector3 = localPlayer.GetPosition()
let y: float = transform.position.y
```

### Conditional expressions with variables

Since Nori has no ternary operator (`?:`), use if/else with a variable:

```rust
let label: string = ""
if score > 100 {
    label = "High"
} else {
    label = "Low"
}
```

### Computed array index

```rust
let index: int = current % items.Length
let item: string = items[index]
```

## Common mistakes

**Expecting short-circuit evaluation:**

```rust
// Both sides ALWAYS evaluate
if index >= 0 && items[index] == target {
    // items[index] may be out of bounds!
}
```

Use nested `if` statements for guard conditions.

**Missing type on the left side of assignment:**

Assignment is a statement, not an expression. You cannot write `let x: int = y = 5`. Each assignment is its own statement.

**Mixing types with `+`:**

The `+` operator automatically converts non-string operands to strings using `ToString()` when the other side is a string. While `"Score: " + score` works, string interpolation is preferred for readability: `"Score: {score}"`.

## See also

- [Types](/language/types/) -- What types these operators work on
- [Control Flow](/language/control-flow/) -- `if`/`else`, loops, and range expressions
- [Variables](/language/variables/) -- Declaring variables that expressions reference
