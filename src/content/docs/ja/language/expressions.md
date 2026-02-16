---
title: 式
description: Noriにおける演算子、メンバアクセス、インデックス、文字列補間、配列リテラル。
sidebar:
  order: 4
---

Noriの式は値を生成します。リテラル、変数参照、演算子、メソッド呼び出し、プロパティアクセス、インデックス、文字列補間、配列リテラルが含まれます。すべての式には、コンパイラが意味解析中に決定する解決済みの型があります。

## 演算子の優先順位

演算子は優先順位の高い（結合が強い）ものから低いものの順に列挙しています：

| 優先順位 | 演算子 | 説明 | 結合規則 |
|------------|-----------|-------------|---------------|
| 1 | `!`、`-`（単項） | 論理NOT、符号反転 | 右結合 |
| 2 | `*`、`/`、`%` | 乗算、除算、剰余 | 左結合 |
| 3 | `+`、`-` | 加算、減算 | 左結合 |
| 4 | `<`、`>`、`<=`、`>=` | 比較 | 左結合 |
| 5 | `==`、`!=` | 等価 | 左結合 |
| 6 | `..` | 範囲 | 左結合 |
| 7 | `&&` | 論理AND | 左結合 |
| 8 | `\|\|` | 論理OR | 左結合 |

括弧を使って優先順位をオーバーライドできます：

```rust
let result: bool = (a + b) > (c * d)
let combined: bool = (x > 0) && (y < 10)
```

## 算術演算子

```rust
let sum: int = a + b        // addition
let diff: int = a - b       // subtraction
let product: int = a * b    // multiplication
let quotient: int = a / b   // division
let remainder: int = a % b  // modulo
let neg: int = -a            // unary negation
```

算術演算子は`int`、`float`、`Vector3`の値に対して動作します。同じ式で`int`と`float`を混在させると、`int`オペランドは暗黙的に`float`に拡張されます：

```rust
let x: int = 5
let y: float = 2.0
let result: float = x * y   // x is widened to float, result is float
```

Vector3は加算、減算、スカラー乗算をサポートします：

```rust
let a: Vector3 = Vector3.up
let b: Vector3 = Vector3.right
let c: Vector3 = a + b               // Vector3 + Vector3
let d: Vector3 = a - b               // Vector3 - Vector3
let e: Vector3 = a * 2.0             // Vector3 * float
let f: Vector3 = 3.0 * b             // float * Vector3
```

## 比較演算子

```rust
let greater: bool = a > b
let less: bool = a < b
let gte: bool = a >= b
let lte: bool = a <= b
```

比較演算子は数値型（`int`、`float`）に対して動作し、`bool`を返します。

## 等価演算子

```rust
let same: bool = a == b
let different: bool = a != b
```

等価演算子は`int`、`float`、`bool`、`string`の値に対して動作します。

## 論理演算子

```rust
let both: bool = a && b     // logical AND
let either: bool = a || b   // logical OR
let nope: bool = !a         // logical NOT
```

`&&`と`||`の両方のオペランドは`bool`でなければなりません。

**重要：** Noriは`&&`と`||`の短絡評価を行いません。式の両辺は常に評価されます。つまり、`obj != null && obj.IsActive()`のようなガードパターンでは、`obj`が`null`の場合でも`obj.IsActive()`が評価されます。代わりにネストした`if`文を使用してください：

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

## 代入演算子

```rust
x = 10           // simple assignment
x += 5           // add and assign (x = x + 5)
x -= 3           // subtract and assign (x = x - 3)
x *= 2           // multiply and assign (x = x * 2)
x /= 4           // divide and assign (x = x / 4)
```

複合代入演算子（`+=`、`-=`、`*=`、`/=`）は省略記法です。現在の値を読み取り、演算を適用し、結果を書き戻します。

## メンバアクセス

ドット構文を使ってオブジェクトのプロパティにアクセスしたりメソッドを呼び出したりします：

```rust
// Properties
let pos: Vector3 = transform.position
let name: string = player.displayName
let active: bool = gameObject.activeSelf

// Methods
gameObject.SetActive(false)
transform.Rotate(Vector3.up, 45.0)
```

### 静的メンバアクセス

型名を通じて静的プロパティとメソッドにアクセスします：

```rust
let dt: float = Time.deltaTime
let t: float = Time.time

let dist: float = Vector3.Distance(pos1, pos2)
let mid: Vector3 = Vector3.Lerp(start, end, 0.5)

let clamped: float = Mathf.Clamp(value, 0.0, 1.0)
let abs: float = Mathf.Abs(x)
```

## インデックス

ブラケット構文で配列要素にアクセスします：

```rust
let first: int = scores[0]
let last: int = scores[scores.Length - 1]

scores[0] = 100
```

インデックス式は`int`でなければなりません。インデックスは0から始まります。

## 文字列補間

波括弧を使って文字列リテラル内に式を埋め込みます：

```rust
let name: string = "World"
log("Hello, {name}!")

let score: int = 42
log("Score: {score}")

let pos: Vector3 = transform.position
log("Position: {pos}")
```

波括弧の中には任意の式を記述できます。式は文字列に変換され、結果に連結されます：

```rust
log("Health: {current_hp}/{max_hp}")
log("Distance: {Vector3.Distance(a, b)}")
log("{player.displayName} scored {points} points")
```

文字列補間は`string`値を生成します。変数に代入したり、引数として渡すことができます：

```rust
let msg: string = "Player {name} has {score} points"
```

## 文字列連結

`+`演算子で文字列を連結することもできます：

```rust
let greeting: string = "Hello, " + name + "!"
```

可読性の観点から、一般的には文字列補間が推奨されます。

## 配列リテラル

ブラケット構文でインラインに配列を作成します：

```rust
let numbers: int[] = [1, 2, 3, 4, 5]
let names: string[] = ["Alice", "Bob", "Charlie"]
let flags: bool[] = [true, false, true]
```

すべての要素は同じ型でなければなりません。結果の配列型は要素から推論されます。

## 範囲式

`..`演算子は範囲を作成し、`for..in`ループでのみ使用されます：

```rust
for i in 0..10 {
    log("Index: {i}")
}
```

範囲`0..10`は0から10を含まない値を生成します。詳細は[制御フロー](/ja/language/control-flow/)を参照してください。

## 組み込みショートカット

Noriは宣言なしで常に利用可能なショートカットをいくつか提供しています：

| ショートカット | 同等の式 | 型 |
|----------|---------------|------|
| `localPlayer` | `Networking.LocalPlayer` | `Player` |
| `gameObject` | UdonBehaviourのGameObject | `GameObject` |
| `transform` | `gameObject.transform` | `Transform` |
| `log(value)` | `Debug.Log(value)` | void |
| `warn(value)` | `Debug.LogWarning(value)` | void |
| `error(value)` | `Debug.LogError(value)` | void |

```rust
on Start {
    log("Hello from {localPlayer.displayName}")
    log("My position: {transform.position}")
    gameObject.SetActive(true)
}
```

## nullリテラル

`null`リテラルは参照の不在を表します。任意の参照型に代入できます：

```rust
let obj: GameObject = null
let player: Player = null
```

## よくあるパターン

### プロパティアクセスの連鎖

```rust
let player_pos: Vector3 = localPlayer.GetPosition()
let y: float = transform.position.y
```

### 変数を使った条件式

Noriには三項演算子（`?:`）がないため、if/elseと変数を使います：

```rust
let label: string = ""
if score > 100 {
    label = "High"
} else {
    label = "Low"
}
```

### 計算された配列インデックス

```rust
let index: int = current % items.Length
let item: string = items[index]
```

## よくある間違い

**短絡評価を期待する：**

```rust
// Both sides ALWAYS evaluate
if index >= 0 && items[index] == target {
    // items[index] may be out of bounds!
}
```

ガード条件にはネストした`if`文を使用してください。

**代入の左辺に型がない：**

代入は文であり、式ではありません。`let x: int = y = 5`のように書くことはできません。各代入は独立した文です。

**`+`で文字列以外を連結する：**

文字列用の`+`演算子は両辺が文字列の場合にのみ機能します。文字列以外の値を埋め込むには文字列補間を使用してください：`"Score: " + score`ではなく`"Score: {score}"`と書きます。

## 関連項目

- [型](/ja/language/types/) -- これらの演算子が動作する型
- [制御フロー](/ja/language/control-flow/) -- `if`/`else`、ループ、範囲式
- [変数](/ja/language/variables/) -- 式が参照する変数の宣言
