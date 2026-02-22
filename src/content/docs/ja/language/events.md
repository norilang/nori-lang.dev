---
title: イベント
description: Noriの組み込みイベントハンドラ -- ライフサイクル、インタラクション、プレイヤー、コリジョン、シリアライゼーションイベント。
sidebar:
  order: 7
---

イベントは、VRChatで発生する出来事にNoriプログラムが応答する仕組みです。プレイヤーがオブジェクトをクリックしたとき、ワールドがロードされたとき、フレームがレンダリングされたとき -- VRChatがイベントを発火し、あなたのコードがそれを処理します。イベントは `on` キーワードの後にイベント名とコードブロックを記述して宣言します。

## イベントハンドラの宣言

```rust
on Start {
    log("World loaded!")
}
```

データを提供するイベントの場合は、括弧内にパラメータを宣言します:

```rust
on PlayerJoined(player: Player) {
    log("{player.displayName} joined!")
}
```

各イベントハンドラはエントリポイントです。VRChatがイベントを発火すると、ブロックの最初の文から実行が開始され、ブロックの終わりまたは `return` 文に到達するまで実行されます。

## イベントリファレンス

### ライフサイクルイベント

GameObjectのUnityライフサイクル中に発火します:

| イベント | パラメータ | 発火タイミング |
|---------|-----------|--------------|
| `Start` | -- | UdonBehaviourが初期化されたとき、一度だけ |
| `Enable` | -- | GameObjectまたはUdonBehaviourが有効化されたとき |
| `Disable` | -- | GameObjectまたはUdonBehaviourが無効化されたとき |
| `Update` | -- | 毎フレーム |
| `LateUpdate` | -- | 毎フレーム、すべての `Update` 呼び出しの後 |
| `FixedUpdate` | -- | 物理ステップごと（固定時間間隔） |
| `MouseDown` | -- | オブジェクトのコライダー上でマウスボタンが押されたとき |
| `Destroy` | -- | GameObjectが破棄されるとき |

```rust
on Start {
    log("Initialized")
}

on Enable {
    log("Enabled")
}

on Disable {
    log("Disabled")
}

on Update {
    // runs every frame
    let dt: float = Time.deltaTime
}

on FixedUpdate {
    // runs at fixed physics rate
}
```

**Start** は最もよく使われるイベントです。状態の初期化、参照の設定、診断メッセージの出力に使用します。UdonBehaviourが最初にアクティブになったときに一度だけ実行されます。

**Update** は毎フレーム実行され、アニメーション、タイマー、入力処理などの継続的なロジックを記述する場所です。パフォーマンスに注意してください -- `Update` 内のコードは毎秒60～90回実行されます。

**FixedUpdate** はフレームレートに関係なく固定間隔（デフォルトで毎秒50回）で実行されます。物理関連のロジックに使用してください。

**LateUpdate** はすべての `Update` 呼び出しが完了した後に実行されます。カメラ追従ロジックや `Update` の結果に反応する必要がある処理に使用してください。

### インタラクションイベント

プレイヤーがGameObjectと対話したときに発火します:

| イベント | パラメータ | 発火タイミング |
|---------|-----------|--------------|
| `Interact` | -- | プレイヤーがオブジェクトをクリック/トリガー（コライダーが必要） |
| `Pickup` | -- | プレイヤーがオブジェクトを拾う（VRC_Pickupが必要） |
| `Drop` | -- | プレイヤーがオブジェクトを落とす |
| `PickupUseDown` | -- | オブジェクトを持っている間にUseボタンを押す |
| `PickupUseUp` | -- | オブジェクトを持っている間にUseボタンを離す |

```rust
on Interact {
    log("Clicked!")
}

on Pickup {
    log("Picked up")
}

on Drop {
    log("Dropped")
}

on PickupUseDown {
    log("Use button pressed")
}

on PickupUseUp {
    log("Use button released")
}
```

**Interact** は最もよく使われるインタラクションイベントです。インタラクションが機能するには、GameObjectにColliderコンポーネントが必要です。VRChatでは、プレイヤーがオブジェクトを指してクリック（デスクトップ）またはトリガー（VR）でインタラクトします。

### プレイヤーイベント

プレイヤーがインスタンスに参加または退出したときに発火します:

| イベント | パラメータ | 発火タイミング |
|---------|-----------|--------------|
| `PlayerJoined` | `player: Player` | プレイヤーがVRChatインスタンスに参加したとき |
| `PlayerLeft` | `player: Player` | プレイヤーがVRChatインスタンスから退出したとき |

```rust
on PlayerJoined(player: Player) {
    log("{player.displayName} joined the world")
    if player.isLocal {
        log("That's me!")
    }
}

on PlayerLeft(player: Player) {
    log("{player.displayName} left the world")
}
```

`PlayerJoined` は、参加時に既にインスタンスにいるすべてのプレイヤーと、その後に到着する新しいプレイヤーに対して発火します。`player` パラメータを通じて、プレイヤーの名前、ローカルかリモートか、インスタンスマスターかどうかにアクセスできます。

### コリジョンとトリガーイベント

物理的なインタラクション中に発火します:

| イベント | パラメータ | 発火タイミング |
|---------|-----------|--------------|
| `TriggerEnter` | `other: Collider` | 別のコライダーがこのオブジェクトのトリガーゾーンに入ったとき |
| `TriggerExit` | `other: Collider` | 別のコライダーがこのオブジェクトのトリガーゾーンから出たとき |
| `CollisionEnter` | `collision: Collision` | 別のオブジェクトがこのオブジェクトと衝突したとき |
| `CollisionExit` | `collision: Collision` | 別のオブジェクトがこのオブジェクトとの衝突を終了したとき |

```rust
on TriggerEnter(other: Collider) {
    log("Something entered the trigger")
}

on TriggerExit(other: Collider) {
    log("Something left the trigger")
}

on CollisionEnter(collision: Collision) {
    log("Collision detected")
}
```

トリガーイベントでは、GameObjectに **Is Trigger** チェックボックスが有効になったColliderコンポーネントが必要です。

### VRCプレイヤー物理イベント

VRChatプレイヤーがトリガーゾーンやコライダーと接触したときに発火します：

| イベント | パラメータ | 発火タイミング |
|---------|-----------|--------------|
| `PlayerTriggerEnter` | `player: Player` | プレイヤーがこのオブジェクトのトリガーゾーンに入ったとき |
| `PlayerTriggerExit` | `player: Player` | プレイヤーがこのオブジェクトのトリガーゾーンから出たとき |
| `PlayerCollisionEnter` | `player: Player` | プレイヤーがこのオブジェクトと衝突したとき |
| `PlayerCollisionExit` | `player: Player` | プレイヤーがこのオブジェクトとの衝突を終了したとき |
| `PlayerParticleCollision` | `player: Player` | このオブジェクトのパーティクルがプレイヤーに当たったとき |

```rust
on PlayerTriggerEnter(player: Player) {
    log("{player.displayName} entered the zone")
}

on PlayerTriggerExit(player: Player) {
    log("{player.displayName} left the zone")
}
```

これらはVRChat固有のイベントで、インタラクションをトリガーした `Player` を提供します。`Collider` や `Collision` オブジェクトを提供する標準のUnityコリジョンイベントとは異なります。

### シリアライゼーションイベント

ネットワーク経由の変数同期中に発火します:

| イベント | パラメータ | 発火タイミング |
|---------|-----------|--------------|
| `VariableChange` | -- | 同期変数がネットワークから更新されたとき（リモートクライアントで発火） |
| `PreSerialization` | -- | 同期変数がネットワークに送信される直前（オーナーで発火） |
| `PostSerialization` | `result: SerializationResult` | シリアライゼーション完了後（オーナーで発火） |
| `Deserialization` | -- | 同期変数がネットワークから更新されたとき（VariableChangeの別名） |
| `OwnershipRequest` | -- | 別のプレイヤーがこのオブジェクトのオーナーシップを要求したとき |
| `OwnershipTransferred` | -- | このオブジェクトのオーナーシップが新しいプレイヤーに移転したとき |

```rust
on VariableChange {
    // synced variables just updated from the owner
    log("Received new data: score = {score}")
    update_display()
}

on PreSerialization {
    // about to send synced variables
    log("Sending data...")
}

on PostSerialization(result: SerializationResult) {
    log("Serialization complete")
}
```

`VariableChange` は最もよく使われるシリアライゼーションイベントです。同期変数の値が更新された後にリモートクライアントで発火します。オーナーが行った状態変更に反応するために使用してください。詳細は[ネットワーキング](/ja/language/networking/)を参照してください。

### VRC機能イベント

VRChat固有の機能に応答して発火します：

| イベント | パラメータ | 発火タイミング |
|---------|-----------|--------------|
| `VideoStart` | -- | このオブジェクトのVRC動画プレイヤーが再生を開始したとき |
| `AvatarEyeHeightChanged` | -- | プレイヤーのアバタースケールが変更されたとき |

### ダウンロードイベント

URLダウンロード操作が完了したときに発火します。コンパイラが `result` パラメータを自動的に注入し、ハンドラ内でアクセスできます：

| イベント | 暗黙のパラメータ | 発火タイミング |
|---------|-------------------|--------------|
| `StringLoadSuccess` | `result: IVRCStringDownload` | 文字列のダウンロードが正常に完了したとき |
| `StringLoadError` | `result: IVRCStringDownload` | 文字列のダウンロードが失敗したとき |
| `ImageLoadSuccess` | `result: IVRCImageDownload` | 画像のダウンロードが正常に完了したとき |
| `ImageLoadError` | `result: IVRCImageDownload` | 画像のダウンロードが失敗したとき |

```rust
pub let url: VRCUrl = null

on Start {
    VRCStringDownloader.LoadUrl(url)
}

on StringLoadSuccess {
    let text: string = result.Result
    log("Downloaded: {text}")
}

on StringLoadError {
    let err: string = result.Error
    error("Download failed: {err}")
}
```

注意：ほとんどのイベントとは異なり、ダウンロードイベントはイベントシグネチャでパラメータを宣言しません。`result` 変数はハンドラ本体内で自動的に利用可能です。コンパイラがパラメータの注入を処理します。

## イベントのコンパイル方法

各イベントハンドラは、Udon Assemblyのラベル付きブロックにコンパイルされます。ラベルはUdonの命名規則に従います（例えば、`Start` は `_start` に、`PlayerJoined` は `_onPlayerJoined` になります）。VRChatがイベントを発火すると、VMは対応するラベルにジャンプして実行を開始します。

各イベントブロックはアドレス `0xFFFFFFFC`（停止センチネル）への `JUMP` で終了します。これはUdon VMにイベントハンドラが終了し、制御をVRChatに戻すべきであることを示します。

イベントは独立したエントリポイントです。互いに呼び出すことはなく、値を返すこともありません。イベント間で共有ロジックが必要な場合は、[関数](/ja/language/functions/)に切り出してください。

## 複数のハンドラ

各イベント名に対して宣言できるハンドラは1つだけです。`on Start` ブロックを2つ宣言するとエラーになります:

```rust
// error: duplicate event handler
on Start {
    log("First")
}

on Start {
    log("Second")
}
```

## パラメータ付きイベント

イベントのパラメータはモジュールレベル変数であり、Noriの他のすべての変数と同様です。VRChatはイベントラベルにジャンプする前にパラメータ値をヒープ変数に書き込みます。イベントシグネチャで宣言します:

```rust
on PlayerJoined(player: Player) {
    // 'player' is populated by VRChat before this code runs
}
```

パラメータの名前と型はVRChatが期待するものと一致する必要があります。コンパイラはNoriの名前を正しいUdonパラメータ変数名にマッピングします。

## よくあるパターン

### Startでの初期化

```rust
pub let max_health: int = 100
let health: int = 0

on Start {
    health = max_health
    log("Game ready. Health: {health}")
}
```

### Updateでのフレームベースアニメーション

```rust
let angle: float = 0.0
pub let rotation_speed: float = 45.0

on Update {
    angle = angle + rotation_speed * Time.deltaTime
    transform.Rotate(Vector3.up, rotation_speed * Time.deltaTime)
}
```

### クールダウン付きインタラクション

```rust
let last_interact: float = 0.0
pub let cooldown: float = 1.0

on Interact {
    let now: float = Time.time
    if now - last_interact < cooldown {
        log("Please wait...")
        return
    }
    last_interact = now
    log("Activated!")
}
```

### プレイヤーの追跡

```rust
let player_count: int = 0

on PlayerJoined(player: Player) {
    player_count = player_count + 1
    log("Players: {player_count}")
}

on PlayerLeft(player: Player) {
    player_count = player_count - 1
    log("Players: {player_count}")
}
```

## よくある間違い

**間違ったイベント名を使う:**

```rust
// warning: unknown event name
on OnStart {
    log("Hello")
}

// correct
on Start {
    log("Hello")
}
```

Noriのイベント名は、Unity C#で使われる「On」プレフィックスを使いません。`OnStart` ではなく `Start` です。`OnInteract` ではなく `Interact` です。

**パラメータなしのイベントに括弧を付ける:**

```rust
// unnecessary but valid
on Start() {
    log("Hello")
}

// preferred
on Start {
    log("Hello")
}
```

**Updateに重い処理を入れる:**

```rust
on Update {
    // runs every frame — avoid expensive operations here
    for i in 0..1000 {
        // this will cause lag
    }
}
```

`Update` ハンドラは軽量に保ちましょう。重い処理は発火頻度の低いイベントに移動するか、タイマーを使って処理を間引いてください。

## 関連項目

- [カスタムイベント](/ja/language/custom-events/) -- ネットワーク機能を持つユーザー定義イベント
- [関数](/ja/language/functions/) -- イベントハンドラから共有ロジックを切り出す
- [ネットワーキング](/ja/language/networking/) -- シリアライゼーションイベントと同期変数
