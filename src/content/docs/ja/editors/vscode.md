---
title: VS Code
description: 専用拡張機能を使用して VS Code に Nori 言語サポートを設定します。
sidebar:
  order: 2
---

VS Code は、シンタックスハイライト、スニペット、組み込み LSP クライアントを含む専用拡張機能により、最も充実した Nori 編集体験を提供します。

## 前提条件

- [VS Code](https://code.visualstudio.com/) 1.80 以降
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)（LSP サーバーのビルドに必要）
- [Node.js](https://nodejs.org/) 18 以上（拡張機能のパッケージングに必要）

## セットアップ

### 方法 A：Unity セットアップウィザード（推奨）

1. Unity で **Tools > Nori > Setup Editor...** に移動します
2. **VS Code** タブを選択します
3. **Build LSP Server** をクリックします — お使いのプラットフォーム向けにサーバーがコンパイルされます
4. **Install VS Code Extension** をクリックします — 拡張機能がパッケージ化されてインストールされます
5. VS Code でプロジェクトを開きます

### 方法 B：手動セットアップ

#### 1. LSP サーバーのビルド

[LSP サーバーのビルド](../building-the-lsp/) の手順に従って、お使いのプラットフォーム用の `nori-lsp` バイナリを取得します。

#### 2. 拡張機能のパッケージ化とインストール

```bash
cd editors~/vscode
npm install
npm run package
```

これにより `.vsix` ファイルが生成されます。以下のコマンドでインストールします：

```bash
code --install-extension nori-lang-0.1.0.vsix
```

#### 3. 拡張機能の設定

VS Code の設定（Ctrl+Comma）を開き、「Nori」で検索します：

- **Nori: Lsp Path** — `nori-lsp` バイナリのフルパスを設定します（例：`C:\nori-project\Packages\dev.nori.compiler\tools~\Nori.Lsp\bin\Release\net8.0\win-x64\publish\nori-lsp.exe`）
- **Nori: Catalog Path** — extern カタログ JSON ファイルのパスを設定します（オプションですが、完全な API カバレッジのために推奨）

または `settings.json` に以下を追加します：

```json
{
  "nori.lsp.path": "/path/to/nori-lsp",
  "nori.catalog.path": "/path/to/extern-catalog.json"
}
```

#### 4. extern カタログの生成

Unity で **Tools > Nori > Generate Extern Catalog** に移動します（または **Project Settings > Nori** のボタンをクリックします）。これにより、リフレクションを使用して VRChat SDK がスキャンされ、利用可能なすべての型とメソッドを含む JSON ファイルが出力されます。

## 表示される内容

設定が完了すると、VS Code の `.nori` ファイルで以下が利用できます：

- **シンタックスハイライト** — バンドルされた TextMate 文法を使用して、キーワード、文字列、数値、コメント、型名が色分けされます
- **エラー波線** — 入力中に構文エラーやセマンティックの問題の箇所に赤い下線が表示されます
- **オートコンプリートポップアップ** — 式の後に `.` を入力すると利用可能なメンバーが表示され、`on` を入力するとイベント名が表示されます
- **ホバーツールチップ** — 識別子にカーソルを合わせると型が表示され、メソッド呼び出しにカーソルを合わせると extern シグネチャが表示されます
- **定義へ移動** — 変数名や関数名を Ctrl+クリック（macOS では Cmd+クリック）すると宣言にジャンプします
- **シグネチャヘルプ** — `()` 内で引数を入力している際に、パラメーター名と型を示すポップアップが表示されます
- **アウトラインビュー** — エクスプローラーサイドバーに、現在のファイル内のすべての変数、関数、イベントが表示されます

## トラブルシューティング

### 拡張機能が有効にならない

- ファイルの拡張子が `.nori` であることを確認してください
- VS Code の出力パネルを確認してください：**View > Output** を選択し、ドロップダウンから **Nori** を選びます
- 拡張機能がインストールされていることを確認してください：ターミナルで `code --list-extensions | grep nori` を実行します

### LSP サーバーが起動しない

- `nori.lsp.path` が有効なバイナリを指していることを確認してください
- macOS/Linux では、バイナリに実行権限があることを確認してください：`chmod +x nori-lsp`
- **View > Output > Nori** でサーバーの起動ログを確認してください

### VRChat の型のオートコンプリートが表示されない

- Unity で extern カタログを生成してください（**Tools > Nori > Generate Extern Catalog**）
- `nori.catalog.path` に生成された JSON ファイルのパスを設定してください
- カタログパスを変更した後は VS Code を再起動してください

### エラーが Unity と一致しない

- LSP サーバーと Unity が同じ extern カタログファイルを使用していることを確認してください
- Nori コンパイラーパッケージを更新した場合は、LSP サーバーを再ビルドしてください
