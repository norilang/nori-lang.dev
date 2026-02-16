---
title: 制限事項
description: Noriにできないこと -- Udon VMの制約と回避策の解説。
sidebar:
  order: 10
---

NoriはUdon Assemblyにコンパイルされ、Udon AssemblyはVRChatのUdon Virtual Machine内で実行されます。Udon VMはサンドボックス化された、ヒープのみの、extern駆動の実行環境です。完全な.NETランタイムは公開されていません。このページでは、Noriにできないことを記載し、各制限がVMレベルでなぜ存在するかを説明し、具体的な回避策を提供します。

## 制約の概要

| 機能 | できない理由 | 回避策 |
|------|------------|--------|
| `List<T>`、`Dictionary<K,V>` | Udonは.NETジェネリクスをサポートしない | 型付き配列（`int[]`、`string[]`） |
| クラス、構造体、インターフェース | Udonにはユーザー定義型がない | 複数の変数、並列配列 |
| 再帰 | Udon VMにコールスタックがない | 反復ループ（`while`、`for`） |
| クロージャ、ラムダ | Udon VMにローカルスコープがない | モジュールレベルフィールド |
| `async`/`await` | Udonで公開されていない | Updateループによるステートマシン |
| `try`/`catch` | 例外処理が公開されていない | nullチェック、バリデーション |
| ファイルI/O | VRChatセキュリティサンドボックス | VRChat Persistence API |
| 任意のHTTP | VRChatセキュリティサンドボックス | VRChat承認済みAPI |
| ローカル変数 | ヒープのみのメモリモデル | すべての変数はモジュールレベルフィールド |
| 演算子オーバーロード | ユーザー定義型がない | 名前付き関数 |
| 短絡評価 `&&`/`\|\|` | EXTERNベースの評価を使用 | 両辺が常に評価される; ネストした `if` を使用 |

## ジェネリックコレクション

### 概要

`List<T>`、`Dictionary<K,V>`、`Queue<T>`、`HashSet<T>`、その他のジェネリックコレクション型は使用できません。

### 理由

Udonの型システムは、externメカニズムを通じて公開された具象.NET型のホワイトリストに基づいています。.NETジェネリクスは実行時の型特殊化を必要としますが、これはexternホワイトリストの一部ではありません。Udon VMにはジェネリック型をインスタンス化するインフラストラクチャがありません。

### 回避策

型付き配列を使用してください。配列はUdonで利用可能な唯一のコレクション型です。

```rust
// Instead of List<int>:
let scores: int[] = [0, 0, 0, 0, 0]
let score_count: int = 0

fn add_score(value: int) {
    if score_count < scores.Length {
        scores[score_count] = value
        score_count = score_count + 1
    }
}
```

```rust
// Instead of Dictionary<string, int>, use parallel arrays:
let keys: string[] = ["health", "score", "level"]
let values: int[] = [100, 0, 1]

fn lookup(key: string) -> int {
    for i in 0..keys.Length {
        if keys[i] == key {
            return values[i]
        }
    }
    return -1
}
```

コンパイラの診断については、エラー [E0042](/errors/E0042/) を参照してください。

## ユーザー定義型

### 概要

クラス、構造体、インターフェース、列挙型を定義することはできません。`class`、`struct`、`interface`、`enum` キーワードはありません。

### 理由

Udonの型システムは、externホワイトリストに存在する型 -- VRChatが明示的に公開した具象.NET型 -- のみをサポートします。コンパイル時に新しい型を登録するメカニズムはありません。Udon VMのヒープはextern型名で値を格納し、ユーザー定義型には対応するエントリがありません。

### 回避策

構造化されたデータを表すには、複数の変数または並列配列を使用してください。

```rust
// Instead of a Player struct with name, score, and alive fields:
let player_names: string[] = null
let player_scores: int[] = null
let player_alive: bool[] = null

fn get_player_score(index: int) -> int {
    return player_scores[index]
}

fn set_player_alive(index: int, alive: bool) {
    player_alive[index] = alive
}
```

単純なグループ化には、命名規則を使用してください:

```rust
let door_is_open: bool = false
let door_angle: float = 0.0
let door_speed: float = 90.0
let door_target: float = 0.0
```

## 再帰

### 概要

関数は直接的にも間接的にも自身を呼び出すことができません。コンパイラは再帰的な呼び出しサイクルを検出し、エラー [E0100](/errors/E0100/) を報告します。

### 理由

Udonにはコールスタックがありません。Noriが関数呼び出しをコンパイルする際、リターンアドレスを1つのヒープ変数に格納して関数本体にジャンプします。関数が自身を呼び出すと、元のリターンアドレスが上書きされ、プログラムは正しい場所に戻れなくなります。真の再帰には、呼び出しごとに成長するスタックが必要ですが、Udon VMにはそれが存在しません。

### 回避策

再帰アルゴリズムを反復ループに書き直してください。

```rust
// Recursive factorial (NOT valid):
// fn factorial(n: int) -> int {
//     if n <= 1 { return 1 }
//     return n * factorial(n - 1)
// }

// Iterative factorial (valid):
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

```rust
// Recursive search (NOT valid):
// fn binary_search(arr: int[], target: int, low: int, high: int) -> int { ... }

// Iterative search (valid):
fn linear_search(arr: int[], target: int) -> int {
    for i in 0..arr.Length {
        if arr[i] == target {
            return i
        }
    }
    return -1
}
```

## クロージャとラムダ

### 概要

無名関数、クロージャ、ラムダ式を作成することはできません。関数を変数に格納したり、引数として渡したりすることはできません。

### 理由

クロージャはローカルスコープをキャプチャしますが、Udonにはローカルスコープがありません。すべての変数はヒープに割り当てられたモジュールレベルのフィールドです。クローズオーバーするスタックフレームがなく、externホワイトリストに関数ポインタ型がなく、Udonの型システムでクロージャオブジェクトを表す方法がありません。

### 回避策

モジュールレベル変数を使って関数間で通信し、関数を名前で呼び出してください。

```rust
// Instead of: items.filter(x => x > threshold)
let filtered_count: int = 0

fn count_above_threshold(items: int[], threshold: int) -> int {
    filtered_count = 0
    for i in 0..items.Length {
        if items[i] > threshold {
            filtered_count = filtered_count + 1
        }
    }
    return filtered_count
}
```

## Async/await

### 概要

`async`、`await`、`Task`、`Promise` 型はありません。コルーチン構文で非同期コードを書くことはできません。

### 理由

Udon VMは各イベントハンドラ内で同期的に実行されます。タスクスケジューラもコルーチンランタイムもなく、ハンドラの途中で実行を一時停止して後で再開する方法がありません。`async`/`await` パターンは、`Task<T>` に裏付けられたコンパイラ生成のステートマシンに依存しますが、これはexternホワイトリストにありません。

### 回避策

`Update` イベントと状態変数を使って、時限的または順序立てた動作を実装してください。

```rust
// Instead of: await Task.Delay(3000)
let wait_timer: float = 0.0
let is_waiting: bool = false

on Interact {
    is_waiting = true
    wait_timer = 3.0
    log("Waiting 3 seconds...")
}

on Update {
    if is_waiting {
        wait_timer = wait_timer - Time.deltaTime
        if wait_timer <= 0.0 {
            is_waiting = false
            log("Done waiting!")
        }
    }
}
```

複数ステップのシーケンスには、ステートマシンを使用してください:

```rust
let sequence_state: int = 0
let sequence_timer: float = 0.0

event StartSequence {
    sequence_state = 1
    sequence_timer = 2.0
}

on Update {
    if sequence_state == 1 {
        log("Phase 1...")
        sequence_timer = sequence_timer - Time.deltaTime
        if sequence_timer <= 0.0 {
            sequence_state = 2
            sequence_timer = 3.0
        }
    } else if sequence_state == 2 {
        log("Phase 2...")
        sequence_timer = sequence_timer - Time.deltaTime
        if sequence_timer <= 0.0 {
            sequence_state = 0
            log("Sequence complete")
        }
    }
}
```

## Try/catch

### 概要

`try`、`catch`、`finally`、`throw` はありません。例外を処理することはできません。

### 理由

Udonは.NETの例外処理メカニズムを公開していません。externシステムはホワイトリストに登録されたメソッドを呼び出し、それらのメソッドが内部的にスローした場合、Udon VMはイベントハンドラを停止します。ユーザーコードで例外をキャッチまたは回復する方法はありません。

### 回避策

入力を使用前にバリデーションしてください。nullチェック、配列の境界チェック、同期変数への書き込み前のオーナーシップチェックを行ってください。

```rust
// Instead of: try { items[index] } catch { ... }
fn safe_get(items: string[], index: int) -> string {
    if index < 0 {
        return ""
    }
    if index >= items.Length {
        return ""
    }
    return items[index]
}
```

```rust
// Instead of: try { obj.DoThing() } catch (NullReferenceException) { }
fn safe_activate(obj: GameObject) {
    if obj != null {
        obj.SetActive(true)
    }
}
```

## ファイルI/O

### 概要

ファイルの読み書き、ファイルシステムへのアクセス、ネットワークソケットのオープンはできません。

### 理由

VRChatはセキュリティサンドボックス内で実行されます。任意のファイルやネットワークアクセスを許可すると、悪意のあるワールドがデータを盗んだりシステムを攻撃したりする可能性があります。Udonは `System.IO`、`System.Net`、その他のファイルシステムAPIを公開していません。

### 回避策

永続データには、SDKバージョンで利用可能な場合はVRChatのPersistence API（PlayerData）を使用してください。ワールド間でのデータ共有には、VRChatの承認済みAPIを使用してください。

## 任意のHTTPリクエスト

### 概要

任意のURLへのHTTPリクエストはできません。`HttpClient`、`WebRequest`、`fetch` はありません。

### 理由

ファイルI/Oと同じセキュリティサンドボックスです。VRChatはデータの窃取や悪用を防ぐためにネットワークアクセスを制限しています。

### 回避策

VRChatの承認済みネットワーキング機能を使用してください: プレイヤー間データには同期変数、承認済み外部コンテンツにはVRChatの画像/動画ロードAPIを使用してください。

## ローカル変数

### 概要

すべての変数は、関数やイベント本体内で宣言された場合でも、モジュールレベルのヒープフィールドです。スタック割り当てのローカル変数はありません。

### 理由

Udon VMはすべてのデータ格納にフラットなヒープを使用します。スタックはありません。各変数宣言はヒープに名前付きスロットを作成し、プログラムの存続期間中保持されます。コンパイラはソースコード内のどこに変数が出現しても、すべてをモジュールスコープに配置します。

### 回避策

これは通常透過的です -- ほとんどのコードで変数は期待通りに動作します。ただし、「ローカル」変数が呼び出し間で値を保持することに注意してください:

```rust
fn increment() {
    let counter: int = 0   // NOT reset each call -- this is a module field
    counter = counter + 1
    log("Counter: {counter}")
}
```

各呼び出しで新しい値が必要な場合は、明示的に代入してください:

```rust
fn increment() {
    let counter: int = 0
    counter = 0             // explicitly reset
    counter = counter + 1
    log("Counter: {counter}")  // always prints 1
}
```

## 演算子オーバーロード

### 概要

独自の型にカスタム演算子を定義することはできません。`operator+` やそれに類するメカニズムはありません。

### 理由

Noriにはユーザー定義型がないため、演算子をオーバーロードする対象がありません。存在する演算子（算術、比較、論理）は、externホワイトリストが提供する型（int、float、Vector3など）で動作するようにハードコードされています。

### 回避策

名前付き関数を使用してください:

```rust
// Instead of overloading + for a custom "point" type:
fn add_points(ax: float, ay: float, bx: float, by: float) {
    result_x = ax + bx
    result_y = ay + by
}
```

## 短絡評価

### 概要

`&&` と `||` 演算子は常に両方のオペランドを評価します。短絡評価はありません。

### 理由

Noriでは、`&&` と `||` はUdonのEXTERN呼び出し（`ConditionalAnd`、`ConditionalOr`）にコンパイルされます。externが呼び出される前に、両方のオペランドが評価されてスタックにプッシュされる必要があります。Udon VMにはオペランドを条件付きでスキップするメカニズムがありません。

### 回避策

ガードパターンにはネストした `if` 文を使用してください:

```rust
// WRONG: obj.activeSelf evaluates even if obj is null
if obj != null && obj.activeSelf {
    log("Active")
}

// CORRECT: nested if prevents the null access
if obj != null {
    if obj.activeSelf {
        log("Active")
    }
}
```

```rust
// WRONG: division happens even if divisor is zero
if divisor != 0 && (value / divisor) > threshold {
    log("Above threshold")
}

// CORRECT: nested if prevents division by zero
if divisor != 0 {
    if (value / divisor) > threshold {
        log("Above threshold")
    }
}
```

## 関連項目

- [言語の概要](/ja/language/) -- Noriにできること
- [型](/ja/language/types/) -- 利用可能な型とexternシステム
- [関数](/ja/language/functions/) -- コールスタックなしでの関数呼び出しの仕組み
- [ネットワーキング](/ja/language/networking/) -- ネットワーキングの制約とパターン
