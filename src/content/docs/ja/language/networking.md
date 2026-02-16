---
title: ネットワーキング
description: Noriにおけるオーナーシップ、同期変数、シリアライゼーション、ネットワークイベント。
sidebar:
  order: 9
---

VRChatのワールドはデフォルトでマルチプレイヤーです。すべてのUdonBehaviourはすべてのプレイヤーのクライアントで実行され、ネットワーキングシステムがそれらを同期させます。NoriはVRChatのネットワーキングモデルを、同期変数、オーナーシップ、シリアライゼーション、ネットワークイベントを通じて公開します。

## オーナーシップモデル

VRChatのすべてのGameObjectには**オーナー**がいます -- そのオブジェクトの同期状態に対して権限を持つ1人のプレイヤーです。オーナーのみが同期変数に書き込み、その変更を他のプレイヤーに複製できます。オーナーでないプレイヤーが同期変数に書き込むと、その変更はローカルにとどまり、次のネットワーク更新で上書きされます。

デフォルトでは、インスタンスの作成者（マスター）がすべてのオブジェクトを所有します。オーナーシップは実行時に移転できます。

## オーナーシップの確認

`Networking.IsOwner()` を使って、ローカルプレイヤーがGameObjectを所有しているか確認します:

```rust
on Interact {
    if Networking.IsOwner(localPlayer, gameObject) {
        log("I own this object")
    } else {
        log("Someone else owns this")
    }
}
```

`localPlayer` ショートカットは常に利用可能で、`Networking.LocalPlayer`（ローカルの `Player` インスタンス）を参照します。

## オーナーシップの移転

`Networking.SetOwner()` を使ってオーナーシップをプレイヤーに移転します:

```rust
on Interact {
    if !Networking.IsOwner(localPlayer, gameObject) {
        Networking.SetOwner(localPlayer, gameObject)
    }
}
```

オーナーシップの移転は即座ではありません -- ネットワークのラウンドトリップが必要です。`SetOwner` を呼び出した後、同期変数を変更する前に移転が完了するのを待ってください。よくあるパターンとして、オーナーシップを要求し、その後のイベントで状態を変更する方法があります。

## 同期変数

`sync` キーワードの後に同期モードを指定して同期変数を宣言します:

```rust
sync none score: int = 0
sync linear position_x: float = 0.0
sync smooth rotation_y: float = 0.0
```

### 同期モード

| モード | 動作 | 適した用途 |
|-------|------|-----------|
| `none` | ネットワーク更新ごとに新しい値にジャンプする。補間なし。 | 離散的な状態: スコア、ブール値、ID、文字列 |
| `linear` | 古い値と新しい値の間を時間経過で線形補間する。 | 一定速度で変化する値: タイマー、カウンター |
| `smooth` | イージングを使ってスムーズに補間する。 | 位置、回転、連続的な動き |

### 同期可能な型

同期変数は、Udonがネットワークシリアライゼーション用にサポートする型で使用できます。よく使われる同期可能な型は以下の通りです:

- `bool`
- `int`, `uint`
- `float`, `double`
- `string`
- `Vector2`, `Vector3`, `Vector4`
- `Quaternion`
- `Color`, `Color32`

配列と参照型（GameObject、Playerなど）は同期できません。

## シリアライゼーションの要求

同期変数を変更した後、`RequestSerialization()` を呼び出して、更新された値を他のクライアントに送信するようVRChatに指示する必要があります:

```rust
sync none score: int = 0

on Interact {
    if Networking.IsOwner(localPlayer, gameObject) {
        score = score + 1
        RequestSerialization()
    }
}
```

`RequestSerialization()` を呼び出さなくても、変数はVRChatのデフォルトスケジュールで最終的に同期されますが、明示的に呼び出すことでタイムリーな配信が保証されます。

## 同期データの受信

同期変数の値がネットワーク経由でリモートクライアントに到着すると、VRChatは `VariableChange` イベントを発火します:

```rust
on VariableChange {
    log("Score updated to: {score}")
    update_display()
}
```

`VariableChange` は**リモート**クライアントでのみ発火します -- オーナーでは発火しません。オーナーは自分が書き込んだため、既に現在の値を持っています。`VariableChange` は、オーナーが行った状態変更に対してUIの更新、エフェクトの再生、または反応するために使用してください。

## ネットワークイベント

カスタムイベントは `send ... to All` または `send ... to Owner` を使ってネットワーク経由で送信できます:

```rust
event PlayEffect {
    log("Playing effect!")
}

on Interact {
    send PlayEffect to All    // runs on every client
}
```

```rust
event OwnerGrantPoint {
    if Networking.IsOwner(localPlayer, gameObject) {
        score = score + 1
        RequestSerialization()
    }
}

on Interact {
    send OwnerGrantPoint to Owner   // runs only on the owner's client
}
```

ネットワークイベントは非同期です。イベントが送信されてからリモートクライアントが実行するまでにレイテンシがあります。詳細は[カスタムイベント](/ja/language/custom-events/)を参照してください。

## localPlayerショートカット

`localPlayer` は `Networking.LocalPlayer`（ローカルプレイヤーの `Player` インスタンス）を参照する組み込みショートカットです。宣言なしで常に利用できます:

```rust
on Start {
    log("My name is {localPlayer.displayName}")
    if localPlayer.isMaster {
        log("I am the instance master")
    }
}
```

## ネットワーキングの完全な例

ネットワーク対応スコアボードの完全な例を示します:

```rust
pub let max_score: int = 10
sync none score: int = 0
sync none is_game_over: bool = false

fn update_display() {
    log("Score: {score}/{max_score}")
}

on Start {
    update_display()
}

// only the owner should modify synced state
event OwnerAddPoint {
    if Networking.IsOwner(localPlayer, gameObject) {
        if !is_game_over {
            score = score + 1
            if score >= max_score {
                is_game_over = true
            }
            RequestSerialization()
        }
    }
}

// any player can click to request a point
on Interact {
    if is_game_over {
        log("Game is over!")
        return
    }
    send OwnerAddPoint to Owner
}

// remote clients react to synced variable changes
on VariableChange {
    update_display()
    if is_game_over {
        log("Game over! Final score: {score}")
    }
}

// reset game (owner only)
event OwnerReset {
    if Networking.IsOwner(localPlayer, gameObject) {
        score = 0
        is_game_over = false
        RequestSerialization()
    }
}
```

## よくあるパターン

### 変更前のオーナーシップ確認

```rust
on Interact {
    if !Networking.IsOwner(localPlayer, gameObject) {
        Networking.SetOwner(localPlayer, gameObject)
    }
    // After ownership is acquired (may need to wait)
    sync_value = sync_value + 1
    RequestSerialization()
}
```

### オーナーシップを取得してから操作

状態変更とオーナーシップ移転を分離する、より堅牢なパターン:

```rust
let wants_to_interact: bool = false

on Interact {
    if Networking.IsOwner(localPlayer, gameObject) {
        do_interact()
    } else {
        wants_to_interact = true
        Networking.SetOwner(localPlayer, gameObject)
    }
}

fn do_interact() {
    is_toggled = !is_toggled
    RequestSerialization()
}
```

### ネットワークトグル

```rust
sync none is_active: bool = false

event ToggleState {
    is_active = !is_active
    RequestSerialization()
}

on Interact {
    if Networking.IsOwner(localPlayer, gameObject) {
        send ToggleState
    } else {
        Networking.SetOwner(localPlayer, gameObject)
        send ToggleState
    }
}

on VariableChange {
    gameObject.SetActive(is_active)
}
```

### マスター専用ロジック

```rust
on Start {
    if localPlayer.isMaster {
        log("I am the master, initializing world state")
        send InitializeWorld
    }
}

event InitializeWorld {
    score = 0
    timer = 300.0
    RequestSerialization()
}
```

## よくある間違い

**`RequestSerialization()` を忘れる:**

```rust
on Interact {
    score = score + 1
    // oops: forgot RequestSerialization()
    // other players won't see the change promptly
}
```

同期変数を変更した後すぐに変更を送信したい場合は、必ず `RequestSerialization()` を呼び出してください。

**オーナーシップなしで同期変数に書き込む:**

```rust
sync none score: int = 0

on Interact {
    score = score + 1           // only works if we're the owner
    RequestSerialization()
}
```

ローカルプレイヤーがオーナーでない場合、書き込みは次のネットワーク更新で上書きされます。必ず先にオーナーシップを確認または取得してください:

```rust
on Interact {
    if Networking.IsOwner(localPlayer, gameObject) {
        score = score + 1
        RequestSerialization()
    }
}
```

**`VariableChange` がオーナーで発火すると期待する:**

```rust
on VariableChange {
    // this only fires on REMOTE clients, not the owner
    update_display()
}
```

オーナーもディスプレイを更新する必要がある場合は、変数を変更した後に直接更新関数を呼び出してください:

```rust
on Interact {
    if Networking.IsOwner(localPlayer, gameObject) {
        score = score + 1
        RequestSerialization()
        update_display()   // owner updates locally
    }
}

on VariableChange {
    update_display()       // remote clients update from network
}
```

**オーナーシップの移転が即座だと期待する:**

```rust
on Interact {
    Networking.SetOwner(localPlayer, gameObject)
    // ownership may not have transferred yet!
    score = score + 1   // might get overwritten
}
```

オーナーシップの移転にはネットワークのラウンドトリップが伴います。遅延に対応できるようにコードを設計してください。

## 関連項目

- [変数](/ja/language/variables/) -- `sync` 変数宣言
- [カスタムイベント](/ja/language/custom-events/) -- `send ... to All|Owner` 構文
- [イベント](/ja/language/events/) -- `VariableChange`、`PreSerialization`、`PostSerialization`
- [制限事項](/ja/language/limitations/) -- ネットワーキングの制約と回避策
