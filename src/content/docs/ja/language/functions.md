---
title: 関数
description: 関数の宣言、パラメータ、戻り値、およびUdonへのコンパイル方法。
sidebar:
  order: 6
---

Noriの関数を使うと、再利用可能なロジックを名前付きブロックに切り出すことができます。関数はパラメータを受け取り、値を返し、すべてのモジュールレベル変数にアクセスできます。関数は `fn` キーワードで宣言し、イベント、カスタムイベント、または他の関数から呼び出すことができます。

## 関数の宣言

パラメータも戻り値もない基本的な関数:

```rust
fn greet() {
    log("Hello!")
}
```

### パラメータ付き

パラメータはコロンの後に型を指定して宣言します:

```rust
fn greet_player(name: string) {
    log("Hello, {name}!")
}

fn add(a: int, b: int) {
    log("Sum: {a + b}")
}
```

### 戻り値の型付き

`->` の後に戻り値の型を指定すると、値を返す関数を宣言できます:

```rust
fn max(a: int, b: int) -> int {
    if a > b {
        return a
    }
    return b
}

fn get_speed() -> float {
    return base_speed * speed_multiplier
}
```

戻り値の型を持つ関数では、すべてのコードパスが `return` 文で終わる必要があります。

### void関数

`->` で戻り値の型を指定しない関数はvoidです。値なしの `return` を使って早期に終了することができます:

```rust
fn update_display() {
    if !is_active {
        return
    }
    log("Score: {score}")
    log("Health: {health}")
}
```

## 関数の呼び出し

関数名の後に括弧を付けて呼び出します:

```rust
on Start {
    greet()
    greet_player("Alice")
    let biggest: int = max(10, 20)
    log("Max is {biggest}")
}
```

関数は同じファイル内で宣言されている必要があります。インポートシステムはありません -- 各 `.nori` ファイルは自己完結しています。

## モジュール変数へのアクセス

関数はモジュールレベルの変数を自由に読み書きできます:

```rust
let score: int = 0
let combo: int = 0

fn add_score(points: int) {
    score = score + (points * combo)
    if score > high_score {
        high_score = score
    }
}

fn reset() {
    score = 0
    combo = 1
}
```

Noriのすべての変数はモジュールレベルのフィールドであるため、関数は自然にビヘイビアの全状態にアクセスできます。

## 関数のコンパイル方法

Noriの関数は真の関数呼び出しにはコンパイルされません。Udonにはコールスタックがないため、コンパイラは各関数をラベル付き命令ブロックとして出力します。関数呼び出しは以下のように実装されます:

1. 引数の値を関数のパラメータ変数にコピーする。
2. リターンアドレスをヒープ変数に保存する。
3. 関数のラベルに `JUMP` する。
4. 関数の終了時に、保存されたリターンアドレスに `JUMP_INDIRECT` で戻る。

つまり関数呼び出しは動作しますが、制限があります:

- コールスタックがありません。各関数にはリターンアドレスのスロットが1つだけあります。
- 既に実行中の関数を呼び出すと、リターンアドレスが上書きされます。
- これが再帰が不可能な理由です。

通常のコードではこのことを意識する必要はありません。コンパイラが透過的に処理します。ただし、特定の機能（再帰、クロージャ）がサポートされない理由を説明するものです。

## 再帰の禁止

再帰的な関数呼び出しはコンパイルエラーになります（[E0100](/errors/E0100/)）。コンパイラはコールグラフを構築し、循環を検出します:

```rust
// error E0100: Recursion detected
fn countdown(n: int) {
    if n <= 0 {
        return
    }
    log("{n}")
    countdown(n - 1)   // recursive call — not allowed
}
```

相互再帰も検出されます:

```rust
// error E0100: Recursion detected
fn ping() {
    pong()
}

fn pong() {
    ping()
}
```

代わりに反復ループを使用してください:

```rust
fn countdown(n: int) {
    let i: int = n
    while i > 0 {
        log("{i}")
        i = i - 1
    }
}
```

## クロージャや第一級関数はない

関数を変数に格納したり、引数として渡したり、他の関数から返したりすることはできません。ラムダ、無名関数、関数ポインタはありません:

```rust
// Not valid Nori:
let callback: fn() = greet    // no function types
items.forEach(process)         // no higher-order functions
```

## パラメータの受け渡し

パラメータはモジュールレベル変数と同様に動作します。関数を呼び出すと、引数の値は関数本体の実行前にパラメータのヒープスロットにコピーされます:

```rust
fn set_position(x: float, y: float, z: float) {
    // x, y, z are module-level variables with the passed-in values
    log("Moving to {x}, {y}, {z}")
}
```

パラメータはヒープ変数であるため、呼び出し間で値が保持されます。これは通常は見えませんが、パラメータがセットされる前に読み取ると（現在の構文ではこれを防いでいます）、前回の呼び出しの値が見えることに注意してください。

## よくあるパターン

### ヘルパー関数

```rust
fn clamp_int(value: int, min_val: int, max_val: int) -> int {
    if value < min_val {
        return min_val
    }
    if value > max_val {
        return max_val
    }
    return value
}
```

### 表示の更新

```rust
let score: int = 0
let health: int = 100

fn update_hud() {
    log("Score: {score} | Health: {health}")
}

on Start {
    update_hud()
}

event ScoreChanged {
    update_hud()
}
```

### ガード関数

```rust
fn is_owner() -> bool {
    return Networking.IsOwner(localPlayer, gameObject)
}

on Interact {
    if !is_owner() {
        Networking.SetOwner(localPlayer, gameObject)
    }
    // now safe to modify synced variables
}
```

### 初期化関数

```rust
fn initialize() {
    score = 0
    health = max_health
    is_game_over = false
    update_hud()
}

on Start {
    initialize()
}

event ResetGame {
    initialize()
}
```

## よくある間違い

**再帰を使おうとする:**

```rust
// error E0100
fn factorial(n: int) -> int {
    if n <= 1 {
        return 1
    }
    return n * factorial(n - 1)
}
```

ループで書き直してください:

```rust
fn factorial(n: int) -> int {
    let result: int = 1
    let i: int = 2
    while i <= n {
        result = result * i
        i = i + 1
    }
    return result
}
```

**パラメータがローカルだと期待する:**

```rust
fn process(value: int) {
    // value is a module-level field, not a stack local
    // it persists between calls
}
```

パラメータは各呼び出し箇所で本体の実行前に上書きされるため、これが問題になることはほとんどありませんが、内部の動作を理解しておくとよいでしょう。

**戻り値の型の矢印を忘れる:**

```rust
// error: missing ->
fn get_name() string {
    return "default"
}

// correct
fn get_name() -> string {
    return "default"
}
```

## 関連項目

- [イベント](/ja/language/events/) -- 組み込みイベントハンドラ（関数とは異なります）
- [カスタムイベント](/ja/language/custom-events/) -- ネットワーク経由で送信できるイベント（関数では不可）
- [制限事項](/ja/language/limitations/) -- 再帰やクロージャがサポートされない理由
