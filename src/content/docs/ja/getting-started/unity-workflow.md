---
title: Unityワークフロー
description: Unity Editor内でのNoriスクリプトの作成、追加、管理。
sidebar:
  order: 2
---

このページでは、Noriスクリプトを扱うUnity側のワークフローを詳しく説明します：ファイルの作成、GameObjectへのアタッチ、インスペクターでのコンパイル出力の確認、ドキュメントコメントによるツールチップの使用。

## スクリプトの作成

新しい `.nori` ファイルを作成するには、**Project** ウィンドウで右クリックし、**Create > Nori Script** を選択します。Unityがスターターテンプレート付きの `NewNoriScript.nori` というファイルを作成し、すぐに名前を入力できるようにリネームモードに入ります。

テンプレートには最小限のプログラムが含まれています：

```rust
on Start {
    log("Hello from Nori!")
}

on Interact {
    log("You clicked me!")
}
```

任意のテキストエディタで `.nori` ファイルを作成し、`Assets/` 内の任意の場所に保存することもできます。

## GameObjectへのスクリプトの追加

NoriスクリプトをGameObjectにアタッチするには2つの方法があります：

### ドラッグ＆ドロップ

1. **Project** ウィンドウで `.nori` ファイルを選択します。
2. **Hierarchy** ウィンドウにドラッグします。
3. Unityがファイル名に基づいた新しいGameObjectを作成し、**NoriScript** コンポーネントが自動的に設定されます。

Hierarchy内の既存のGameObjectにドラッグすることで、新しいGameObjectを作成する代わりに、そのGameObjectにスクリプトを追加することもできます。

### Add Componentメニュー

1. シーン内のGameObjectを選択します。
2. Inspectorで **Add Component** をクリックし、**Nori > Nori Script** を選択します。
3. Projectウィンドウから `.nori` ファイルを、表示された **Nori Source** フィールドにドラッグします。

どちらの方法でも、背後で非表示のUdonBehaviourが自動的に作成され、コンパイルされたプログラムにリンクされます。UdonBehaviourを手動で設定する必要はありません。

## インスペクター

NoriScriptコンポーネントを持つGameObjectを選択すると、インスペクターには以下が表示されます：

- **ステータスバー** — スクリプトが問題なくコンパイルされた場合は「Compiled OK」、問題がある場合は「2 errors, 1 warning」のような要約を表示します。
- **Nori Source** — このコンポーネントに割り当てられた `.nori` ファイル。フィールドをクリックするとProjectウィンドウでファイルの場所が表示されます。
- **Source Script** — `.nori` アセットへの読み取り専用の参照。
- **Recompile** — クリックするとスクリプトの再コンパイルを強制します。手動変更後に便利です。
- **Compile All Nori Programs** — プロジェクト内のすべての `.nori` ファイルを再コンパイルします。
- **Public Variables** — すべての `pub let` 変数を一覧するフォールドアウト。他のUnityコンポーネントと同じように値を編集できます。
- **Compiled Nori Udon Assembly** — 生成されたUdon Assemblyテキストを表示するフォールドアウト。
- **Program Disassembly** — 逆アセンブルされたプログラムバイトコードを表示するフォールドアウト（VRChat SDKが必要）。

## インラインコンパイルエラー

`.nori` ファイルにエラーや警告がある場合、インスペクターのステータスバーに「2 errors, 1 warning」のようなカウントが表示されます。ステータスバーの下には **Diagnostics** フォールドアウトがあり、各問題が以下の情報とともに表示されます：

- **エラーコード** — 例：`N0012`
- **行番号** — 問題が発生している `.nori` ファイルの行
- **メッセージ** — 問題の説明
- **ヒント** — 修正方法の提案（利用可能な場合）

エラーは赤いアイコン、警告は黄色いアイコンで表示されます。テキストエディタで問題を修正してファイルを保存すると、診断情報は自動的に更新されます。

## 自動リフレッシュ

インスペクターは、Unityアセットパイプライン経由で `.nori` ファイルの変更を監視しています。外部エディタで `.nori` ファイルを保存すると、Unityが変更を検出してファイルを再インポートし、インスペクターが自動的に更新されます。通常の開発では **Recompile** をクリックする必要はありません — 保存してインスペクターを確認するだけです。

**Tools > Nori > Compile All Nori Scripts** からいつでもすべてのスクリプトの完全な再コンパイルをトリガーすることもできます。

## ドキュメントコメント

`pub let` 宣言の上に `///` コメントを使うと、Unity Inspectorでツールチップとして表示される説明を追加できます。変数のフィールドにカーソルを合わせると、コメントのテキストがツールチップとして表示されます。

```rust
/// Maximum health points for this character.
pub let max_health: int = 100

/// How fast the door opens, in degrees per second.
/// Higher values make the animation snappier.
pub let door_speed: float = 90.0
```

インスペクターでは、**Max Health** にカーソルを合わせると「Maximum health points for this character.」と表示され、**Door Speed** にカーソルを合わせると「How fast the door opens, in degrees per second. Higher values make the animation snappier.」と表示されます。

ドキュメントコメントは、直下の `pub let` 宣言にのみ適用されます。コメントと宣言の間に空行があっても構いません。通常の `//` コメントはツールチップシステムでは無視されます。
