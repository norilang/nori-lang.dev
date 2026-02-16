---
title: インストール
description: Noriを始めよう — パッケージをインストールして最初のプログラムを書きましょう。
sidebar:
  order: 1
---

## Noriとは？

Noriは、VRChatワールドを構築するためのプログラミング言語で、Udon Assemblyにコンパイルされます。ビジュアルノードグラフの代わりに、読みやすいテキストベースのコードで記述でき、VRChat APIのすべてにアクセスできます。Noriは明示的な型制約を強制し、問題が発生した場合にわかりやすいエラーメッセージを表示します。また、完全なAPIドキュメントが付属しているため、利用可能なメソッドや型をいつでも確認できます。

## 前提条件

Noriをインストールする前に、以下を準備してください：

- **VRChat Creator Companion (VCC)** — VRChat Unityプロジェクトを管理するための公式ツールです。[VRChat公式サイト](https://vrchat.com/home/download)からダウンロードできます。
- **Unity 2022.3 LTS** — 現在のVRChat SDKが必要とするUnityバージョンです。VCCからインストールしてください。
- **VRChat SDK (Worlds)** — Worlds SDKパッケージです。VCCからプロジェクトに追加してください。

## VCCからインストール

1. 以下のボタンをクリックして、NoriパッケージリポジトリをVCCに追加します：

   **[VCCに追加](vcc://vpm/addRepo?url=https%3A%2F%2Fvcc.nori-lang.dev%2Findex.json)**

   または、VCCを開いて **Settings > Packages** に移動し、**Add Repository** をクリックして以下を貼り付けます：

   ```
   https://vcc.nori-lang.dev/index.json
   ```

2. VCCでVRChatワールドプロジェクトを開き、**Manage Project** をクリックします。
3. パッケージ一覧から **Nori Language** を見つけ、**Add** をクリックします。

## UPMからインストール

Unity内で直接パッケージを追加したい場合：

1. Unityでプロジェクトを開きます。
2. **Window > Package Manager** に移動します。
3. 左上の **+** ボタンをクリックし、**Add package from git URL...** を選択します。
4. 以下のURLを貼り付けます：

   ```
   https://github.com/norilang/nori.git?path=Packages/dev.nori.compiler
   ```

5. **Add** をクリックします。UnityがNoriコンパイラパッケージをダウンロードしてインストールします。

## インストールの確認

パッケージがインストールされたら、簡単なプログラムを作成して動作を確認しましょう。

1. **Project** ウィンドウで右クリックし、**Create > Nori Script** を選択します。
2. ファイル名を `hello.nori` に変更します。スターターテンプレートが含まれています：

   ```rust
   on Start {
       log("Hello from Nori!")
   }

   on Interact {
       log("You clicked me!")
   }
   ```

3. Projectウィンドウから `hello.nori` を **Hierarchy** にドラッグして新しいGameObjectを作成します。
4. **Playモード** に入ります。
5. **Console** ウィンドウ（**Window > General > Console**）を開き、`Hello from Nori!` というメッセージが表示されることを確認します。
6. Gameビューでそのオブジェクトをクリックして、Interactイベントをトリガーします。`You clicked me!` と表示されるはずです。

両方のメッセージが表示されれば、Noriは正しくインストールされ動作しています。

## 次のステップ

- [はじめてのワールド](/ja/getting-started/your-first-world/) — シンプルなインタラクティブVRChatワールドをステップバイステップで構築します。
- [サンプル集](/ja/getting-started/examples/) — よくあるVRChatワールドパターンの注釈付きコードサンプル。
- [言語リファレンス](/ja/language/variables/) — Nori言語の構文と機能の完全なドキュメント。
