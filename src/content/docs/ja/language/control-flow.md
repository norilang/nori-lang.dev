---
title: 制御フロー
description: Noriにおける条件分岐、ループ、break、continue、return。
sidebar:
  order: 5
---

Noriは分岐に`if`/`else`、ループに`while`と`for..in`、フロー制御に`break`、`continue`、`return`を提供します。`switch`、`match`、三項演算子はありません。

## If / else

`if`文は条件を評価し、条件が`true`の場合にコードブロックを実行します。波括弧は必須です。条件の周りに括弧は使いません。

```rust
if health <= 0 {
    log("Game over")
}
```

### Else

```rust
if is_open {
    log("Door is open")
} else {
    log("Door is closed")
}
```

### Else if

`else if`で複数の条件を連鎖させます：

```rust
if score >= 100 {
    log("Excellent!")
} else if score >= 50 {
    log("Good")
} else if score >= 25 {
    log("Okay")
} else {
    log("Keep trying")
}
```

`else if`分岐の数に制限はありません。

### ネスト

```rust
if player != null {
    if player.isLocal {
        log("This is the local player")
    } else {
        log("This is a remote player")
    }
}
```

Noriは`&&`と`||`の短絡評価を行わないため、ネストがガードパターンを実装する正しい方法です。詳細は[式](/ja/language/expressions/)を参照してください。

## whileループ

`while`ループは条件が`true`である限りブロックを繰り返します：

```rust
let i: int = 0
while i < 10 {
    log("Step {i}")
    i = i + 1
}
```

条件は各反復の前にチェックされます。最初のチェックで条件が`false`の場合、本体は一度も実行されません。

### whileによるカウントループ

```rust
let count: int = 0
while count < items.Length {
    log("Item: {items[count]}")
    count = count + 1
}
```

## for..in 範囲

範囲を使った`for..in`ループは整数の列を反復処理します：

```rust
for i in 0..10 {
    log("Index: {i}")
}
```

範囲`0..10`は0、1、2、...、9の値を生成します。終端値は排他的で、`10`は含まれません。

ループ変数（例の`i`）は`int`型で、ループ本体内で使用できます。Noriのすべての変数と同様に、スタックローカル変数ではなくモジュールレベルのフィールドです。

### 式による範囲

範囲の開始値と終了値の両方に式を使用できます：

```rust
for i in start..end {
    log("Value: {i}")
}

for i in 0..items.Length {
    log("Item {i}: {items[i]}")
}
```

## for..in コレクション

`for..in`ループは配列の反復処理にも使用できます：

```rust
let names: string[] = ["Alice", "Bob", "Charlie"]

for name in names {
    log("Hello, {name}!")
}
```

ループ変数は配列の要素型を取ります。`string[]`の場合、ループ変数は`string`になります。`int[]`の場合、ループ変数は`int`になります。

```rust
let scores: int[] = [10, 20, 30]

for score in scores {
    log("Score: {score}")
}
```

## Break

`break`文は最も内側のループを直ちに終了します：

```rust
for i in 0..100 {
    if items[i] == target {
        log("Found at index {i}")
        break
    }
}
```

`break`は`while`と`for..in`の両方のループで使用できます。

## Continue

`continue`文は現在の反復の残りをスキップし、次の反復に進みます：

```rust
for i in 0..items.Length {
    if items[i] == "" {
        continue    // skip empty items
    }
    log("Item: {items[i]}")
}
```

## Return

`return`文は現在のイベントハンドラまたは関数を終了します。

戻り値の型がある関数では、`return`に値を含める必要があります：

```rust
fn max(a: int, b: int) -> int {
    if a > b {
        return a
    }
    return b
}
```

イベントハンドラまたはvoid関数では、`return`は値なしで終了します：

```rust
on Interact {
    if is_locked {
        log("This is locked")
        return
    }
    log("Interacting...")
}
```

```rust
fn reset() {
    if !is_active {
        return    // exit early
    }
    score = 0
    health = 100
}
```

## switchやmatchはない

Noriには`switch`文や`match`文がありません。代わりに`if`/`else if`/`else`の連鎖を使用してください：

```rust
// Instead of switch(state):
if state == 0 {
    log("Idle")
} else if state == 1 {
    log("Walking")
} else if state == 2 {
    log("Running")
} else {
    log("Unknown state")
}
```

## よくあるパターン

### ステートマシン

```rust
let state: int = 0

on Update {
    if state == 0 {
        // Idle state
        if should_activate {
            state = 1
        }
    } else if state == 1 {
        // Active state
        timer = timer - Time.deltaTime
        if timer <= 0.0 {
            state = 2
        }
    } else if state == 2 {
        // Cooldown state
        cooldown = cooldown - Time.deltaTime
        if cooldown <= 0.0 {
            state = 0
        }
    }
}
```

### breakを使った検索ループ

```rust
let found_index: int = -1

for i in 0..items.Length {
    if items[i] == target {
        found_index = i
        break
    }
}

if found_index >= 0 {
    log("Found at {found_index}")
} else {
    log("Not found")
}
```

### フィルタとカウント

```rust
let count: int = 0

for i in 0..items.Length {
    if items[i] > threshold {
        count = count + 1
    }
}

log("{count} items above threshold")
```

### 早期リターンによるガード

```rust
fn process_player(player: Player) {
    if player == null {
        return
    }
    if !player.isLocal {
        return
    }
    // safe to proceed
    log("Processing {player.displayName}")
}
```

## よくある間違い

**波括弧を忘れる：**

```rust
// error: braces are required
if x > 0
    log("positive")

// correct
if x > 0 {
    log("positive")
}
```

**条件の周りに括弧を付ける：**

```rust
// This works but is unnecessary
if (x > 0) {
    log("positive")
}

// Preferred style: no parentheses
if x > 0 {
    log("positive")
}
```

条件の周りの括弧は許可されていますが、慣用的ではありません。NoriはRustスタイルの括弧なし`if`に従います。

**for..inの範囲が包含的だと思い込む：**

```rust
for i in 0..5 {
    // iterates: 0, 1, 2, 3, 4
    // does NOT include 5
}
```

終端値は排他的です。`0..5`は6回ではなく5回の反復（0から4まで）を行います。

**C言語スタイルの`for`構文を使う：**

```rust
// error: not valid Nori
for (int i = 0; i < 10; i++) { }

// correct
for i in 0..10 { }
```

## 関連項目

- [式](/ja/language/expressions/) -- 条件と演算子の優先順位
- [関数](/ja/language/functions/) -- 値を伴う`return`の使用
- [イベント](/ja/language/events/) -- 制御フローがよく使われるイベントハンドラ
