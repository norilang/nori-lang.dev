---
title: 変数
description: Noriにおける変数宣言 — let、pub let、sync、型注釈。
sidebar:
  order: 2
---

Noriの変数はUdonBehaviourのフィールドを宣言します。ファイルのトップレベルに書かれた変数も、イベントや関数本体の中に書かれた変数も、すべてUdonメモリ上のヒープ割り当てフィールドになります。Noriにはスタック割り当てのローカル変数はありません。

## 変数の宣言

基本的な変数宣言には`let`を使います：

```rust
let health: int = 100
let player_name: string = "Unknown"
let is_active: bool = false
let move_speed: float = 5.0
```

すべての宣言には3つの要素が必要です：

1. 名前
2. 型注釈（コロンの後）
3. 初期値（等号の後）

## パブリック変数

`pub let`を使うと、変数をUnity Inspectorに表示できます。これにより、デザイナーはコードを編集せずに値を調整できます：

```rust
pub let max_health: int = 100
pub let greeting: string = "Welcome!"
pub let door_speed: float = 90.0
pub let target_object: GameObject = null
```

パブリック変数は、Unity EditorのUdonBehaviourコンポーネント上で編集可能なフィールドとして表示されます。コード内の初期値はデフォルト値として機能しますが、実行時にはInspectorの値が優先されます。

## ドキュメントコメント

`pub let`宣言の直前に`///`コメントを使うと、Unity Inspectorでツールチップとして表示される説明を付与できます：

```rust
/// Maximum health points for this character.
pub let max_health: int = 100

/// How fast the door opens, in degrees per second.
/// Higher values make the animation snappier.
pub let door_speed: float = 90.0
```

複数の`///`行は1つのツールチップ文字列に結合されます。コメントと宣言の間に空行があっても構いません。抽出されるのは`///`コメントのみで、通常の`//`コメントは無視されます。

ドキュメントコメントは`pub let`変数にのみ適用されます。プライベートな`let`や`sync`宣言の上のコメントはInspectorに影響しません。

## 同期変数

`sync`を使うと、ネットワーク経由ですべてのプレイヤーに複製される変数を宣言できます：

```rust
sync none score: int = 0
sync linear position_x: float = 0.0
sync smooth rotation_y: float = 0.0
```

同期モードは、リモートクライアントがネットワーク更新間をどのように補間するかを制御します：

| モード | 動作 |
|------|----------|
| `none` | 補間なし。各ネットワーク更新時に最新の同期値にジャンプします。スコア、トグル、IDなどの離散的な状態に使用します。 |
| `linear` | 古い値と新しい値の間を時間経過で線形補間します。タイマーのように一定の速度で変化する値に使用します。 |
| `smooth` | スムーズ（イーズイン/イーズアウト）補間。位置、回転、または滑らかに見せたい値に使用します。 |

同期変数は常に暗黙的にパブリックです。Inspectorに表示され、ビヘイビアのシリアライズ状態の一部になります。

## 型注釈

型注釈はすべての変数宣言で必須です。Noriは型推論を行いません：

```rust
let count: int = 0          // correct
let count = 0                // error: missing type annotation
```

利用可能な型の全一覧は[型](/ja/language/types/)を参照してください。

## デフォルト値

すべての型には初期化子として使用できるデフォルト値があります：

```rust
let a: int = 0
let b: float = 0.0
let c: bool = false
let d: string = ""
let e: GameObject = null
let f: Vector3 = Vector3.zero
```

参照型（GameObject、Transform、Playerなど）のデフォルトは`null`です。数値型のデフォルトはゼロです。ブーリアン型のデフォルトは`false`です。

## 配列変数

配列変数は型にブラケット構文を付けて宣言します：

```rust
let scores: int[] = null
let names: string[] = null
pub let waypoints: GameObject[] = null
```

配列は参照型であり、通常コード内では`null`で初期化します。パブリック配列の場合は、Unity Inspectorで要素を割り当てます。配列の詳細は[型](/ja/language/types/)を参照してください。

## すべての変数はモジュールレベルのフィールド

Noriの変数について最も重要なことは、ローカル変数が存在しないということです。イベントハンドラや関数本体の中で`let`を書いても、その変数はUdonヒープ上のモジュールレベルフィールドになります。

```rust
on Interact {
    let count: int = 0     // this is NOT a local variable
    count = count + 1      // this modifies a module-level field
    log("Count: {count}")
}
```

上の例では、`count`はトップレベルで宣言された変数と同様にヒープ割り当てフィールドです。プログラム開始時（`Start`イベント内）に`0`で初期化され、`Interact`が発火するたびに初期化されるわけではありません。ブロック内の宣言は名前のスコープを限定するための構文上の便宜ですが、ストレージはすべての呼び出しで共有されます。

これは「ローカル」変数がイベント呼び出し間で値を保持することを意味します。オブジェクトを3回クリックすると、countは1ではなく3になります。`count`はスタック変数ではなくフィールドだからです。

イベントが発火するたびに変数をリセットしたい場合は、明示的に代入してください：

```rust
let count: int = 0

on Interact {
    count = 0              // explicitly reset
    count = count + 1
    log("Count: {count}")  // always prints 1
}
```

## よくあるパターン

### パブリック変数による設定

```rust
pub let damage: int = 10
pub let cooldown: float = 2.0
pub let effect_color: Color = null
pub let hit_sound: AudioSource = null
```

### ネットワーク化された状態

```rust
sync none is_locked: bool = false
sync none owner_name: string = ""
sync smooth door_angle: float = 0.0
```

### イベント間の状態追跡

```rust
let last_interact_time: float = 0.0

on Interact {
    let now: float = Time.time
    if now - last_interact_time > 1.0 {
        last_interact_time = now
        log("Interaction accepted")
    } else {
        log("Too fast, wait a moment")
    }
}
```

## よくある間違い

**関数内の`let`がローカル変数を作ると思い込む：**

```rust
fn reset_and_count() {
    let x: int = 0   // x is a module field, NOT a stack local
    x = x + 1        // x persists between calls
}
```

`reset_and_count`を呼び出すたびに同じ`x`がインクリメントされます。呼び出しごとに新しい値が必要な場合は、関数の先頭で明示的に代入してください。

**型注釈を忘れる：**

```rust
let speed = 5.0    // error: expected ':'
```

Noriでは明示的な型が必要です。`let speed: float = 5.0`と書いてください。

**`let`の代わりに`var`や`const`を使う：**

Noriではすべての変数宣言に`let`を使います。`var`、`const`、`val`キーワードはありません。

## 関連項目

- [型](/ja/language/types/) -- 利用可能な型の全一覧
- [ネットワーキング](/ja/language/networking/) -- 同期変数のネットワーク上での動作
- [制限事項](/ja/language/limitations/) -- ローカル変数がない理由
