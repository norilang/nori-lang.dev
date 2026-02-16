---
title: JetBrains Rider
description: 組み込みの LSP クライアントを使用して JetBrains Rider に Nori 言語サポートを設定します。
sidebar:
  order: 3
---

JetBrains Rider 2023.2 以降には、Nori 言語サーバーと連携する組み込みの LSP クライアントが含まれています。

## 前提条件

- [JetBrains Rider](https://www.jetbrains.com/rider/) 2023.2 以降
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)（LSP サーバーのビルドに必要）

## セットアップ

### 1. LSP サーバーのビルド

[LSP サーバーのビルド](../building-the-lsp/) の手順に従って、お使いのプラットフォーム用の `nori-lsp` バイナリを取得します。

Unity セットアップウィザード（**Tools > Nori > Setup Editor...**）を使用してサーバーをビルドし、バイナリパスをクリップボードにコピーすることもできます。

### 2. Rider の LSP クライアントの設定

1. **Settings > Languages & Frameworks > Language Servers** を開きます
2. **Add**（+）をクリックして新しい設定を作成します
3. 以下を設定します：
   - **Name:** `Nori`
   - **Server executable:** `nori-lsp` バイナリのパス
   - **File patterns:** `*.nori`
   - **Arguments:** `--catalog /path/to/extern-catalog.json`（オプションですが推奨）

### 3. シンタックスハイライトの追加

Rider は **TextMate Bundles** プラグインを通じて TextMate 文法をサポートしています：

1. JetBrains Marketplace から **TextMate Bundles** プラグインをインストールします
2. **Settings > Editor > TextMate Bundles** に移動します
3. **Add** をクリックし、Nori パッケージの `editors~/vscode/` ディレクトリを選択します（`.tmLanguage.json` 文法が含まれています）
4. Rider を再起動します

### 4. `.nori` ファイルタイプの登録

`.nori` ファイルが自動的に認識されない場合：

1. **Settings > Editor > File Types** に移動します
2. **Recognized File Types** の下で **Add**（+）をクリックします
3. ファイルタイプ名を `Nori` にし、パターンとして `*.nori` を追加します

## 機能

LSP サーバーが動作している状態で、以下の機能が利用できます：

- 約 200ms 以内にエラー診断（赤い下線）が表示されます
- `.`（型メンバー）、`:`（型）、`on`（イベント）の入力後にオートコンプリートが表示されます
- 型、シグネチャ、extern マッピングを示すホバー情報が表示されます
- 変数、関数、カスタムイベントへの定義へ移動が利用できます
- 関数/メソッド呼び出し中にシグネチャヘルプが表示されます
- すべての宣言を表示するドキュメントアウトラインが利用できます

## トラブルシューティング

### サーバーが起動しない

- Rider のイベントログでエラーを確認してください（**View > Tool Windows > Event Log**）
- macOS/Linux では、バイナリに実行権限があることを確認してください：`chmod +x nori-lsp`
- サーバーバイナリを手動で実行して確認してください：`./nori-lsp --help`

### シンタックスハイライトが表示されない

- TextMate Bundles プラグインがインストールされ、有効になっていることを確認してください
- バンドルパスが `syntaxes/nori.tmLanguage.json` を含む `editors~/vscode/` ディレクトリを指していることを確認してください
- バンドルを追加した後は Rider を再起動してください

### 型情報が表示されない

- Unity で extern カタログを生成してください（**Tools > Nori > Generate Extern Catalog**）
- Language Server の引数に `--catalog /path/to/catalog.json` を追加してください
- カタログパスを変更した後は言語サーバーを再起動してください
