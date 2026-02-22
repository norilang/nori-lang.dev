---
title: サンプル集
description: よくあるVRChatワールドパターンの注釈付きNoriコードサンプル。
sidebar:
  order: 4
---

このページでは、VRChatワールドを構築する際によく使うパターンの注釈付きNoriサンプルを集めています。各サンプルは独立しており、使用されている主要な概念の解説が含まれています。

## 1. Hello World

最もシンプルなNoriプログラムです。ワールドが読み込まれたときにメッセージをログ出力し、プレイヤーがオブジェクトをクリックしたときにもう1つメッセージを出力します。

```rust
on Start {
    log("Hello from Nori!")
}

on Interact {
    log("You clicked me!")
}
```

**行ごとの解説：**

- `on Start { ... }` -- `Start` イベントはUdonBehaviourが初期化されるとき（通常はワールド読み込み時）に一度だけ発火します。セットアップロジックを記述する場所です。
- `log("Hello from Nori!")` -- Unity Console（エディタで確認可能）とVRChatのログ出力にメッセージを出力します。デバッグに便利です。
- `on Interact { ... }` -- `Interact` イベントはプレイヤーがオブジェクトを指してクリックしたときに発火します。インタラクションが動作するにはオブジェクトにコライダーが必要です。
- `log("You clicked me!")` -- インタラクションが発生したときに2つ目のメッセージを出力します。

**主要な概念：**
- 組み込みイベント（`Start`、`Interact`）がコードの実行タイミングを定義します。
- `log()` は開発中の主要なデバッグツールです。
- すべてのNoriプログラムはUdonBehaviourを介して単一のGameObjectにアタッチされます。

## 2. トグルドア

クリックすると開閉するドアです。パブリック変数、フレームごとの更新、フレームレートに依存しないアニメーションを実演します。

```rust
pub let speed: float = 90.0
let is_open: bool = false
let current_angle: float = 0.0
let target_angle: float = 0.0

on Interact {
    is_open = !is_open
    if is_open {
        target_angle = 90.0
    } else {
        target_angle = 0.0
    }
}

on Update {
    if current_angle != target_angle {
        let step: float = speed * Time.deltaTime
        if current_angle < target_angle {
            current_angle = current_angle + step
            if current_angle > target_angle {
                current_angle = target_angle
            }
        } else {
            current_angle = current_angle - step
            if current_angle < target_angle {
                current_angle = target_angle
            }
        }
    }
}
```

**仕組み：**

- `pub let speed: float = 90.0` -- `pub` キーワードによりこの変数がUnity Inspectorに公開されます。ワールドクリエイターはコードを編集せずにドアの速度を変更できます。回転速度には小数値が含まれるため、型は `float` です。
- `is_open = !is_open` -- `!` 演算子はブーリアンを反転させます。クリックするたびに開閉状態が切り替わります。
- `on Update { ... }` -- このイベントはレンダリングされるフレームごとに一度実行されます。フレームレートは変動します（VRヘッドセットは72や90 FPSで動作することがあります）ので、フレームごとに固定量でオブジェクトを移動させるべきではありません。
- `Time.deltaTime` -- 前のフレームからの経過時間を秒単位で返します。`deltaTime` を掛けることで、1秒あたりの速度を正しいフレームごとの増分に変換し、すべてのハードウェアでスムーズなアニメーションを実現します。
- クランプロジック（例：`if current_angle > target_angle { current_angle = target_angle }`）はドアが目標を超えないようにします。クランプしないと、ドアが90度を超えて振動する可能性があります。

**主要な概念：**
- `pub let` はデザイン時の調整のためにInspectorに変数を公開します。
- `on Update` はアニメーションや物理演算などの継続的なフレームごとのロジックに使います。
- フレームレート非依存にするため、移動量には常に `Time.deltaTime` を掛けましょう。
- インクリメンタルなアニメーションではオーバーシュートを防ぐためにクランプを使いましょう。

## 3. ネットワーク同期スコアボード

マルチプレイヤーセッション内の全プレイヤーでポイントを追跡するスコアボードです。同期変数、カスタムイベント、関数、ネットワークメッセージングを実演します。

```rust
pub let max_score: int = 10
sync none score: int = 0
let is_game_over: bool = false

on Start {
    log("Scoreboard ready!")
}

fn update_display() {
    log("Score: {score}")
}

event AddPoint {
    score = score + 1
    update_display()
    if score >= max_score {
        send GameOver to All
    }
}

event GameOver {
    is_game_over = true
    log("Game over! Final score: {score}")
}

on Interact {
    if is_game_over {
        log("Game is over!")
        return
    }
    send AddPoint to All
}
```

**この例でのネットワーキングの仕組み：**

- `sync none score: int = 0` -- `sync` キーワードは変数にネットワーク複製のマークを付けます。オーナーがこの値を更新しシリアライゼーションが要求されると、VRChatが新しい値を他のすべてのプレイヤーに送信します。`none` 同期モードは補間なしで値を送信します（位置データなどの場合に更新間を補間する `linear` や `smooth` とは異なります）。
- `event AddPoint { ... }` -- カスタムイベントは、自分で定義し名前で呼び出すコードブロックです。組み込みイベント（`Start`、`Update`）とは異なり、カスタムイベントは自動的には発火しません。`send` で明示的にトリガーした場合にのみ実行されます。
- `send AddPoint to All` -- 送信者を含むインスタンス内のすべてのクライアントで `AddPoint` イベントをトリガーします。これによりすべてのプレイヤーが同じロジックを実行します。`send ... to Owner` を使ってオブジェクトのネットワークオーナーのみをターゲットにすることもできます。
- `fn update_display()` -- 通常の関数です。関数は直接呼び出され、ローカルで実行されます。ネットワークイベントにする必要のない繰り返しロジックを切り出すのに便利です。
- `return` -- 現在のイベントハンドラーを早期に終了し、それ以降の実行を防ぎます。ここではゲーム終了後のインタラクションをショートサーキットしています。

**主要な概念：**
- `sync none` は補間なしで変数をすべてのクライアントに複製します。
- `event` は `send` でトリガーできるカスタムイベントを定義します。
- `send ... to All` はインスタンス内のすべてのプレイヤーにイベントをブロードキャストします。
- `fn` はプログラム内でのコード再利用のためにローカル関数を宣言します。
- `return` はイベントハンドラーからの早期終了を提供します。

## 4. テレポーター

インタラクションしたプレイヤーを目標位置にテレポートします。ローカルプレイヤーへのアクセス、VRChat APIメソッドの呼び出し、`Vector3` 型と `Quaternion` 型の使用を実演します。

```rust
pub let target_position: Vector3 = Vector3.zero
pub let target_rotation: Quaternion = Quaternion.identity

on Interact {
    let player: Player = localPlayer
    player.TeleportTo(target_position, target_rotation)
    log("Teleported!")
}
```

**仕組み：**

- `pub let target_position: Vector3 = Vector3.zero` -- `(0, 0, 0)` で初期化されたパブリック `Vector3` 変数です。`pub` なので、Unity InspectorでX、Y、Z座標を入力して正確なテレポート先を設定できます。`Vector3.zero` はゼロベクトルを返す静的プロパティです。
- `pub let target_rotation: Quaternion = Quaternion.identity` -- テレポート後のプレイヤーの向きを指定するパブリック `Quaternion` です。`Quaternion.identity` は回転なし（デフォルトの方向を向く）を意味します。Inspectorでこの値を設定して、到着時のプレイヤーの向きを制御できます。
- `let player: Player = localPlayer` -- `localPlayer` はこのコードを実行しているプレイヤーを表す `Player` オブジェクトを返す組み込み値です。`Player` 型はVRChatの `VRCPlayerApi` に対応し、`TeleportTo`、`GetPosition`、`IsOwner` などのメソッドにアクセスできます。
- `player.TeleportTo(target_position, target_rotation)` -- ローカルプレイヤーに対してVRChatのテレポートメソッドを呼び出します。プレイヤーを即座に目標の位置と回転に移動させます。このメソッドはローカルプレイヤーにのみ動作します。他のプレイヤーを直接テレポートさせることはできません。
- `log("Teleported!")` -- コンソールでの確認メッセージ。テレポートされたプレイヤーのクライアントにのみ表示されます。

**主要な概念：**
- `localPlayer` は現在のコードを実行しているプレイヤーにアクセスできます。
- `Player` 型はVRChatの `VRCPlayerApi` とそのすべてのメソッドをラップしています。
- `Vector3` と `Quaternion` は位置と回転を表すUnityの型です。
- Unity型を使った `pub let` により、Inspectorで位置や回転を設定できます。
- `TeleportTo` はローカルプレイヤーにのみ影響するクライアントサイドの操作です。

## 5. ゲームタイマー

全プレイヤー間で同期するカウントダウンタイマーで、時間切れ時にイベントを発火します。リアルタイムカウントダウン、手動同期のための `RequestSerialization()`、複数のネットワーキングパターンの組み合わせを実演します。

```rust
pub let duration: float = 60.0
sync none time_remaining: float = 0.0
let is_running: bool = false

on Interact {
    if !is_running {
        time_remaining = duration
        is_running = true
        RequestSerialization()
        log("Timer started!")
    }
}

on Update {
    if is_running {
        time_remaining = time_remaining - Time.deltaTime
        if time_remaining <= 0.0 {
            time_remaining = 0.0
            is_running = false
            RequestSerialization()
            send TimerDone to All
        }
    }
}

event TimerDone {
    log("Time's up!")
}
```

**仕組み：**

- `pub let duration: float = 60.0` -- Inspectorで編集可能な合計カウントダウン時間（秒単位）。デフォルトは60秒（1分）です。
- `sync none time_remaining: float = 0.0` -- 現在の残り時間で、全プレイヤー間で同期されます。ここで `none` 同期モードを使うと、値がそのまま送信されます。タイマー表示の場合、リモートクライアントでよりスムーズな視覚的カウントダウンを得るために、ネットワーク更新間を補間する `linear` や `smooth` 同期モードの使用を検討してもよいでしょう。
- `RequestSerialization()` -- VRChatにすべての同期変数の現在の値を他のプレイヤーに送信するよう明示的に指示します。Noriは変数が変更されるたびに自動的にシリアライズを行うわけではないため、これが必要です。タイマーの開始時と終了時など、意味のあるタイミングで呼び出すべきです。`on Update` 内で毎フレーム呼び出すとネットワーク帯域幅を浪費します。
- `time_remaining = time_remaining - Time.deltaTime` -- 毎フレーム、経過したフレーム時間を残り時間から減算します。`Time.deltaTime` は秒単位で計測されるため、フレームレートに関係なくリアルタイムのカウントダウンが実現されます。
- `if time_remaining <= 0.0` -- カウントダウンがゼロに達すると、タイマーは `is_running = false` を設定して自身を停止し、残り時間を正確に `0.0` にクランプして負の値を防ぎ、最終状態を同期し、すべてのプレイヤーに `TimerDone` イベントをブロードキャストします。
- `send TimerDone to All` -- タイマーが終了したことをすべてのクライアントに通知します。各クライアントが独立して `TimerDone` イベントハンドラーを実行し、ラウンドの終了、UIの表示、サウンドの再生などのゲームロジックをトリガーできます。
- `on Interact` の `if !is_running` ガードは、タイマーがすでにカウントダウン中の場合にプレイヤーが再スタートするのを防ぎます。

**主要な概念：**
- `RequestSerialization()` はすべての `sync` 変数のネットワーク同期を手動でトリガーします。
- `RequestSerialization()` は毎フレームではなく、意味のある状態遷移時に呼び出しましょう。
- `on Update` 内の `Time.deltaTime` でリアルタイムのカウントダウンやタイマーを作成できます。
- `sync` 変数と `send ... to All` イベントを組み合わせて、連携したマルチプレイヤーロジックを実現します。
- ガード句（`if !is_running`）で重複や競合するアクションを防ぎます。

## 6. カラー変更ピックアップ

プレイヤーがUseボタンを押すたびにマテリアルの色をランダムに変更するピックアップオブジェクトです。コンストラクタ呼び出し、GetComponent、Materialプロパティへのアクセスを実演します。

```rust
pub let target: GameObject = null
let target_material: Material = null

on Start {
    let renderer: MeshRenderer = target.GetComponent(MeshRenderer)
    target_material = renderer.material
}

on PickupUseDown {
    target_material.color = Color(Random.value, Random.value, Random.value, 1.0)
}
```

**仕組み：**

- `pub let target: GameObject = null` -- 色を変更する対象のGameObjectへのパブリック参照です。Inspectorでこのフィールドに対象オブジェクトをドラッグします。
- `let target_material: Material = null` -- マテリアル参照を保持します。`Start` で一度だけ取得することで、繰り返しの検索を避けます。
- `target.GetComponent(MeshRenderer)` -- 対象のGameObjectから `MeshRenderer` コンポーネントを取得します。型名 `MeshRenderer` は（文字列ではなく）直接渡されます。コンパイラがそれを正しいUdon型参照に解決します。
- `renderer.material` -- レンダラーに割り当てられたマテリアルにアクセスします。これはインスタンスマテリアルなので、変更はこのオブジェクトにのみ影響します。
- `Color(Random.value, Random.value, Random.value, 1.0)` -- ランダムな赤、緑、青のコンポーネントで新しい `Color` 値を構築します。`Random.value` は0.0から1.0の間の `float` を返します。4番目の引数はアルファ値（1.0 = 完全に不透明）です。これはコンストラクタ呼び出しで、関数呼び出しのように見えますが新しい `Color` 値を作成します。

**主要な概念：**
- `Color(r, g, b, a)` のようなコンストラクタ呼び出しで新しい値型インスタンスを作成します。
- `GetComponent(TypeName)` は文字列ではなく型引数を使ってコンポーネントを取得します。
- `Random.value` は0.0から1.0の間のランダムな `float` を返します。
- フレームごとに検索する代わりに、`Start` でコンポーネント参照をキャッシュしましょう。

## 7. プレイヤーフォロワー

ローカルプレイヤーの頭の位置をXZ平面上で追跡し、毎フレームスムーズに補間するオブジェクトです。VRトラッキングデータ、コンストラクタ呼び出し、フレームレート非依存の移動を実演します。

```rust
on Update {
    let tracking: TrackingData = localPlayer.GetTrackingData(TrackingDataType.Head)
    let head_pos: Vector3 = tracking.position
    let target_pos: Vector3 = Vector3(head_pos.x, 0.0, head_pos.z)
    transform.position = Vector3.Lerp(transform.position, target_pos, Time.deltaTime * 2.0)
}
```

**仕組み：**

- `localPlayer.GetTrackingData(TrackingDataType.Head)` -- ローカルプレイヤーの頭の現在のトラッキングデータを取得します。`TrackingDataType` は `Head`、`LeftHand`、`RightHand`、`Origin` の値を持つ列挙型です。メソッドは `position` と `rotation` の両方を含む `TrackingData` 値を返します。
- `tracking.position` -- トラッキングデータから `Vector3` の位置を抽出します。VRではプレイヤーのヘッドセットの実際の位置です。デスクトップではカメラの位置に対応します。
- `Vector3(head_pos.x, 0.0, head_pos.z)` -- 頭のXとZ座標を使用し、Yを0.0に設定して新しい `Vector3` を構築します。これにより位置が地面の平面に射影され、フォロワーが床レベルに留まります。
- `Vector3.Lerp(transform.position, target_pos, Time.deltaTime * 2.0)` -- オブジェクトの現在位置と目標位置の間を線形補間します。`Time.deltaTime * 2.0` の係数によりフレームレート非依存のスムーズな移動が実現されます。値を大きくするとオブジェクトの追従が速くなります。

**主要な概念：**
- `TrackingDataType` はトラッキングする体の部位を指定するための列挙型です。
- `GetTrackingData()` は `.position` と `.rotation` プロパティを持つ `TrackingData` 値を返します。
- `Vector3(x, y, z)` は個別のコンポーネントから新しいベクトルを構築します。
- `Vector3.Lerp()` と `Time.deltaTime` でスムーズなフレームレート非依存の移動を作成します。
- XZ平面への射影（Yを0.0に設定）は地面レベルの追従でよく使われるパターンです。
