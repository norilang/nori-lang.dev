---
title: 型
description: Noriの型システム — プリミティブ型、配列、Unity型、VRChat型。
sidebar:
  order: 3
---

Noriの型システムはVRChatのUdon VMで利用可能な型に直接マッピングされます。すべてのNori型には、コンパイラがアセンブリ生成時に使用する対応するUdon型名があります。ユーザー定義型、ジェネリクス、型推論はありません。

## プリミティブ型

| Nori型 | Udon型 | 説明 | リテラルの例 |
|-----------|-----------|-------------|-----------------|
| `bool` | `SystemBoolean` | 真または偽 | `true`、`false` |
| `int` | `SystemInt32` | 32ビット符号付き整数 | `42`、`-7`、`0` |
| `uint` | `SystemUInt32` | 32ビット符号なし整数 | `0` |
| `float` | `SystemSingle` | 32ビット浮動小数点数 | `3.14`、`0.0`、`-1.5` |
| `double` | `SystemDouble` | 64ビット浮動小数点数 | `0.0` |
| `string` | `SystemString` | テキスト | `"hello"`、`""` |
| `char` | `SystemChar` | 単一文字 | -- |
| `object` | `SystemObject` | すべてのオブジェクトの基底型 | `null` |
| `void` | `SystemVoid` | 値なし（戻り値の型のみ） | -- |

最もよく使われるプリミティブ型は`bool`、`int`、`float`、`string`です。小数を扱う場合はほとんど`float`を使います。これはUnityの慣例に合致し、ほとんどのUdon externは`SystemSingle`を期待します。

## Unity型

| Nori型 | Udon型 | 説明 |
|-----------|-----------|-------------|
| `Vector2` | `UnityEngineVector2` | 2Dベクトル（x, y） |
| `Vector3` | `UnityEngineVector3` | 3Dベクトル（x, y, z） |
| `Vector4` | `UnityEngineVector4` | 4Dベクトル（x, y, z, w） |
| `Quaternion` | `UnityEngineQuaternion` | 回転 |
| `Color` | `UnityEngineColor` | RGBAカラー（floatコンポーネント） |
| `Color32` | `UnityEngineColor32` | RGBAカラー（byteコンポーネント） |
| `Transform` | `UnityEngineTransform` | GameObjectの位置、回転、スケール |
| `GameObject` | `UnityEngineGameObject` | Unityシーンオブジェクト |
| `Rigidbody` | `UnityEngineRigidbody` | 物理ボディ |
| `Collider` | `UnityEngineCollider` | 物理コライダー |
| `MeshRenderer` | `UnityEngineMeshRenderer` | メッシュレンダリングコンポーネント |
| `AudioSource` | `UnityEngineAudioSource` | オーディオ再生コンポーネント |
| `Animator` | `UnityEngineAnimator` | アニメーションコントローラー |
| `Collision` | `UnityEngineCollision` | 衝突イベントデータ |
| `Material` | `UnityEngineMaterial` | レンダリング用マテリアル（カラー、シェーダープロパティ） |
| `Renderer` | `UnityEngineRenderer` | 基底レンダラーコンポーネント |
| `LineRenderer` | `UnityEngineLineRenderer` | 3D空間にラインを描画 |
| `ConstantForce` | `UnityEngineConstantForce` | 一定の物理力を適用 |
| `Component` | `UnityEngineComponent` | すべてのコンポーネントの基底クラス |

## VRChat型

| Nori型 | Udon型 | 説明 |
|-----------|-----------|-------------|
| `Player` | `VRCSDKBaseVRCPlayerApi` | VRChatプレイヤー。ローカルプレイヤーには`localPlayer`を使用。 |
| `SerializationResult` | `VRCSDKBaseVRCSerializationResult` | シリアライゼーション操作の結果 |
| `UdonBehaviour` | `VRCUdonUdonBehaviour` | 別のUdonBehaviourへの参照 |
| `VRCObjectPool` | `VRCSDK3ComponentsVRCObjectPool` | 再利用可能なGameObjectのプール |
| `VRCObjectSync` | `VRCSDK3ComponentsVRCObjectSync` | ネットワーク経由でオブジェクトの位置/回転を同期 |
| `VRCAvatarPedestal` | `VRCSDK3ComponentsVRCAvatarPedestal` | アバター試着用のペデスタル |
| `VRCPickup` | `VRCSDK3ComponentsVRCPickup` | 拾えるオブジェクトのコンポーネント |
| `VRCVideoPlayer` | `VRCSDK3VideoComponentsBaseBaseVRCVideoPlayer` | 動画プレイヤーコンポーネント |
| `VRCUrlInputField` | `VRCSDK3ComponentsVRCUrlInputField` | URL入力フィールドコンポーネント |
| `VRCUrl` | `VRCSDKBaseVRCUrl` | 動画/ダウンロード用のURL値型 |
| `VRCImageDownloader` | `VRCSDK3ImageVRCImageDownloader` | URLから画像をダウンロード |
| `TextureInfo` | `VRCSDK3ImageTextureInfo` | テクスチャダウンロードの設定 |
| `TrackingData` | `VRCSDKBaseVRCPlayerApiTrackingData` | VRトラッキングの位置と回転データ |
| `IVRCStringDownload` | `VRCSDK3StringLoadingIVRCStringDownload` | 文字列ダウンロードの結果（`.Result`、`.Error`、`.ErrorCode` プロパティを持つ） |
| `IVRCImageDownload` | `VRCSDK3ImageIVRCImageDownload` | 画像ダウンロードの結果（`.Error`、`.ErrorMessage` プロパティを持つ） |

`Player`はVRChat固有のロジックで最も頻繁に使う型です。`displayName`、`isLocal`、`isMaster`などのプロパティを提供します。

## UI型

Unityの組み込みUIコンポーネントを使ってワールド内インターフェースを作成できます：

| Nori型 | Udon型 | 主要プロパティ | 説明 |
|-----------|-----------|--------------|-------------|
| `UIText` | `UnityEngineUIText` | `.text: string` | UIにテキストを表示 |
| `UIToggle` | `UnityEngineUIToggle` | `.isOn: bool` | チェックボックス / トグルスイッチ |
| `UISlider` | `UnityEngineUISlider` | `.value: float` | 数値スライダー（デフォルトで0.0～1.0） |
| `UIDropdown` | `UnityEngineUIDropdown` | `.value: int` | ドロップダウンメニュー（値は選択されたインデックス） |
| `UIInputField` | `UnityEngineUIInputField` | `.text: string` | テキスト入力フィールド |

```rust
pub let label: UIText = null
pub let volume_slider: UISlider = null

on Start {
    label.text = "Hello!"
    let vol: float = volume_slider.value
    log("Volume: {vol}")
}
```

これらはUnityの`UnityEngine.UI`名前空間に対応します。CanvasのUIコンポーネントをInspectorフィールドにドラッグして割り当てます。

## 列挙型

NoriはUnityとVRChatのいくつかの組み込み列挙型をサポートしています。`型名.値`の構文で列挙値にアクセスします：

| Nori型 | 値 | 説明 |
|-----------|--------|-------------|
| `KeyCode` | `KeyCode.Space`、`KeyCode.W`、`KeyCode.Return`、`KeyCode.Escape`、... | キーボードのキー定数 |
| `TrackingDataType` | `TrackingDataType.Head`、`.LeftHand`、`.RightHand`、`.Origin` | VRトラッキングポイント |
| `PickupHand` | `PickupHand.Left`、`PickupHand.Right` | VRの手の識別子 |

```rust
on Update {
    if Input.GetKeyDown(KeyCode.Space) {
        log("Space pressed!")
    }
}
```

```rust
on Update {
    let tracking: TrackingData = localPlayer.GetTrackingData(TrackingDataType.Head)
    let head_pos: Vector3 = tracking.position
    log("Head at: {head_pos}")
}
```

Noriでは独自の列挙型を定義することはできません。Udon VMが認識する列挙型のみ利用可能です。

## 配列型

配列はNoriで唯一利用可能なコレクション型です。要素型の後に`[]`を付けて配列を宣言します：

```rust
let scores: int[] = null
let names: string[] = null
let positions: Vector3[] = null
pub let targets: GameObject[] = null
```

Nori型の`int[]`はUdon型の`SystemInt32Array`にマッピングされます。パターンは一貫しています：`type[]`は`{UdonType}Array`になります。

### 配列の操作

インデックスによる要素アクセスと長さの取得：

```rust
let items: string[] = null

on Start {
    let first: string = items[0]
    let count: int = items.Length
    log("First item: {first}, total: {count}")
}
```

インデックスによる要素の設定：

```rust
let values: int[] = null

on Start {
    values[0] = 42
    values[1] = 100
}
```

配列リテラル構文による配列の作成：

```rust
let primes: int[] = [2, 3, 5, 7, 11]
let greetings: string[] = ["hello", "world"]
```

`for..in`による配列の反復処理：

```rust
let names: string[] = ["Alice", "Bob", "Charlie"]

on Start {
    for name in names {
        log("Hello, {name}!")
    }
}
```

## 静的型

一部の型は静的プロパティとメソッドのためだけに使用されます。これらの型のインスタンスを作成することはなく、名前を通じて直接アクセスします：

| 型 | 説明 | 例 |
|------|-------------|---------|
| `Time` | フレームタイミング | `Time.deltaTime`、`Time.time` |
| `Networking` | VRChatネットワーキング | `Networking.LocalPlayer`、`Networking.IsOwner()` |
| `Mathf` | 数学関数 | `Mathf.Abs()`、`Mathf.Lerp()`、`Mathf.Clamp()` |
| `Physics` | 物理クエリ | `Physics.Raycast()` |
| `Vector3` | Vector3静的メンバ | `Vector3.zero`、`Vector3.Lerp()`、`Vector3.Distance()` |
| `Vector2` | Vector2静的メンバ | `Vector2.zero` |
| `Vector4` | Vector4静的メンバ | -- |
| `Quaternion` | Quaternion静的メンバ | `Quaternion.identity` |
| `Color` | Color静的メンバ | -- |
| `Random` | ランダム値 | `Random.value`、`Random.Range()`、`Random.ColorHSV()` |
| `Input` | キーボード入力 | `Input.GetKeyDown()`、`Input.GetKey()`、`Input.GetKeyUp()` |
| `String` | 文字列ユーティリティ | `String.Format()`、`String.Concat()` |
| `Utilities` | VRChatユーティリティ | `Utilities.IsValid()` |
| `VRCPlayerApi` | Player API静的メソッド | `VRCPlayerApi.GetPlayers()` |
| `VRCStringDownloader` | 文字列ダウンロード | `VRCStringDownloader.LoadUrl()` |

```rust
on Update {
    let dt: float = Time.deltaTime
    let pos: Vector3 = transform.position
    let dist: float = Vector3.Distance(pos, Vector3.zero)
    log("Distance from origin: {dist}")
}
```

## 暗黙の型変換

Noriは3つの暗黙的な型変換をサポートしています。これらは値の代入や引数渡しの際に自動的に行われます：

| 変換元 | 変換先 | 例 |
|------|----|---------|
| `int` | `float` | `let f: float = 42` -- `int`の42が`float`に変換される |
| `int` | `double` | `let d: double = 42` -- `int`の42が`double`に変換される |
| `float` | `double` | `let d: double = 3.14` -- `float`の3.14が`double`に変換される |

これらの変換は演算子のオペランドにも適用されます。`5 * 2.0`と書くと、`int`の5は乗算の前に`float`に拡張されます。

その他の型の不一致はすべてコンパイルエラー（[E0040](/errors/E0040/)）になります。

## サポートされていないもの

### ジェネリクス

Noriは`List<T>`や`Dictionary<K,V>`のようなジェネリック型をサポートしていません。Udonの型システムはexternホワイトリストを通じて公開された具象.NET型に基づいており、.NETジェネリクスはそのホワイトリストに含まれていません。

代わりに型付き配列を使用してください：

```rust
// Instead of List<int>:
let scores: int[] = [0, 0, 0, 0, 0]

// Instead of List<string>:
let names: string[] = null
```

詳細は[E0042](/errors/E0042/)を参照してください。

### ユーザー定義型

Noriで定義できるクラス、構造体、インターフェース、列挙型はありません。Udonにはユーザー定義型のメカニズムがありません。関連するデータをグループ化する必要がある場合は、並列配列や複数の変数を使用してください：

```rust
// Instead of a Player struct:
let player_names: string[] = null
let player_scores: int[] = null
let player_alive: bool[] = null
```

### Nullable型

`int?`や`bool?`の構文はありません。プリミティブ型は常に値を持ちます。参照型（GameObject、Playerなど）は`null`にできます。

### 型推論

Noriではすべての宣言に明示的な型注釈が必要です。`var`や`auto`キーワードはありません：

```rust
let x: int = 5       // correct
let x = 5            // error
```

## よくあるパターン

### 型安全な参照

```rust
pub let door: GameObject = null
pub let audio: AudioSource = null
pub let spawn_point: Transform = null
```

Unity Inspectorでオブジェクトをフィールドにドラッグして割り当てます。

### ベクトルの操作

```rust
let velocity: Vector3 = Vector3.zero

on Update {
    velocity = Vector3.Lerp(velocity, Vector3.zero, Time.deltaTime)
    transform.position = transform.position + velocity * Time.deltaTime
}
```

## 関連項目

- [変数](/ja/language/variables/) -- 型を指定した変数の宣言方法
- [式](/ja/language/expressions/) -- これらの型に対して使える演算子
- [制限事項](/ja/language/limitations/) -- サポートされていない機能の全一覧とその理由
