---
title: カスタムイベント
description: カスタムイベントの定義と送信 -- Noriにおけるローカル呼び出しとネットワークイベント。
sidebar:
  order: 8
---

カスタムイベントは、ローカルまたはネットワーク経由で他のクライアントにトリガーできるユーザー定義のロジックブロックです。関数（ローカル専用）とVRChatのネットワークイベントシステムの橋渡しをします。

## カスタムイベントの定義

`event` キーワードの後に名前とコードブロックを記述します:

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

カスタムイベント名はファイル内で一意でなければなりません。変数や関数と同じ命名規則に従います。

## カスタムイベントの送信

### ローカル送信

`send` を使って、このUdonBehaviourでカスタムイベントをローカルにトリガーします:

```rust
send ScoreChanged
```

これはUdonの `SendCustomEvent` に相当します。イベントはローカルクライアントで即座に実行され、関数呼び出しと同様に動作します。

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

### 全クライアントへのネットワーク送信

`send ... to All` を使って、送信者を含むVRChatインスタンス内のすべてのクライアントでイベントをトリガーします:

```rust
send GameOver to All
```

これはUdonの `SendCustomNetworkEvent` を `All` ターゲットで使用します。イベントはすべてのプレイヤーのこのUdonBehaviourのコピーで発火します。

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

### オーナーへのネットワーク送信

`send ... to Owner` を使って、GameObjectを所有するクライアントでのみイベントをトリガーします:

```rust
send RequestUpdate to Owner
```

これは `SendCustomNetworkEvent` を `Owner` ターゲットで使用します。GameObjectのオーナーのみがイベント本体を実行します。

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

## カスタムイベントと関数の比較

カスタムイベントと関数はどちらも再利用可能なロジックをカプセル化しますが、目的が異なります:

| 機能 | `fn` 関数 | `event` カスタムイベント |
|------|----------|----------------------|
| ローカル呼び出し | `my_function()` | `send MyEvent` |
| ネットワーク呼び出し | 不可 | `send MyEvent to All\|Owner` |
| パラメータ | あり | なし |
| 戻り値 | あり | なし |
| Udon出力 | `JUMP_INDIRECT` を使った内部ラベル | エクスポートされたラベル（プレーン名） |

ローカルロジックでパラメータや戻り値が必要な場合は**関数**を使用してください。ネットワーク経由でロジックをトリガーする必要がある場合は**カスタムイベント**を使用してください。

### エクスポートされたラベル

カスタムイベントは、プレーン名（アンダースコアのプレフィックスなし）でエクスポートされたUdonラベルを生成します。これにより、VRChatのネットワーキングシステムがイベントを見つけて呼び出すことができます。`Start` のような組み込みイベントはアンダースコア付きのラベル（`_start`）にコンパイルされますが、カスタムイベントは名前がそのまま使われます。

```rust
event MyEvent {
    // compiles to label "MyEvent" in Udon Assembly
}
```

## カスタムイベントと関数の組み合わせ

よくあるパターンとして、カスタムイベントを定義し、実際のロジックは関数で呼び出す方法があります:

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

これにより、関数の柔軟性（パラメータ、戻り値、直接呼び出し）とカスタムイベントのネットワーク機能を両立できます。

## エラー処理

### 無効な送信ターゲット (E0020)

`to` のターゲットは `All` または `Owner` のいずれかでなければなりません:

```rust
// error E0020: Invalid send target
send MyEvent to Everyone

// correct
send MyEvent to All
send MyEvent to Owner
```

### 未定義のカスタムイベント (E0071)

同じファイル内で定義されているイベントのみ送信できます:

```rust
// error E0071: Undefined custom event 'DoStuff'
send DoStuff

// fix: define the event
event DoStuff {
    log("Doing stuff")
}
send DoStuff
```

## よくあるパターン

### ネットワークトグル

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

### オーナー権限アクション

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

### ゲーム状態の遷移

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

### 連鎖イベント

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

## よくある間違い

**カスタムイベントにパラメータを渡そうとする:**

```rust
// error: custom events do not take parameters
event Damage(amount: int) {
    health = health - amount
}
```

カスタムイベントはパラメータを持てません。データを渡すにはモジュールレベル変数を使用してください:

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

**`send` と関数呼び出しを混同する:**

```rust
// wrong: this tries to call a function named MyEvent
MyEvent()

// correct: use send for custom events
send MyEvent
```

**ネットワークイベントが非同期であることを忘れる:**

```rust
on Interact {
    send UpdateScore to All
    // code here runs immediately on the local client
    // the remote clients have NOT received the event yet
    log("Sent!")
}
```

ネットワーク送信は瞬時ではありません。リモートクライアントがイベントを実行するまでにレイテンシがあります。

## 関連項目

- [関数](/ja/language/functions/) -- パラメータと戻り値を持つローカルロジック
- [イベント](/ja/language/events/) -- 組み込みVRChatイベントハンドラ
- [ネットワーキング](/ja/language/networking/) -- オーナーシップ、同期変数、ネットワーキングモデル全体
