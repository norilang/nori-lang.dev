---
title: Visual Studio
description: 汎用 LSP クライアントを使用して Visual Studio に Nori 言語サポートを設定します。
sidebar:
  order: 4
---

Visual Studio 2022 17.8 以降は、Nori 言語サーバーと連携する汎用 LSP クライアントをサポートしています。

## 前提条件

- [Visual Studio 2022](https://visualstudio.microsoft.com/) バージョン 17.8 以降
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)（LSP サーバーのビルドに必要）

## セットアップ

### 1. LSP サーバーのビルド

[LSP サーバーのビルド](../building-the-lsp/) の手順に従って、`nori-lsp.exe` バイナリを取得します。

Unity セットアップウィザード（**Tools > Nori > Setup Editor...**）を使用してサーバーをビルドし、バイナリパスをクリップボードにコピーすることもできます。

### 2. LSP クライアントの設定

ソリューションまたはプロジェクトのルートに `.noriconfig` ファイルを作成します：

```json
{
  "language": "nori",
  "extensions": [".nori"],
  "lspServer": "C:\\path\\to\\nori-lsp.exe",
  "lspServerArgs": ["--catalog", "C:\\path\\to\\extern-catalog.json"]
}
```

パスをお使いのシステムの実際の場所に置き換えてください。`--catalog` 引数はオプションですが、完全な VRChat API カバレッジのために推奨されます。

### 3. `.nori` ファイルタイプの登録

1. Visual Studio で **Tools > Options > Text Editor > File Extension** に移動します
2. **Editor: Source Code (Text) Editor** を選択して `.nori` を追加します
3. **OK** をクリックし、Visual Studio を再起動します

## 代替方法：VS Code 拡張機能の互換性

Visual Studio 2022 は互換性レイヤーを通じて一部の VS Code 拡張機能をサポートしています。Nori VS Code 拡張機能（`editors~/vscode/` 内）はこのアプローチで限定的に動作する可能性がありますが、上記の手動 LSP 設定の方がより確実です。

## 機能

LSP サーバーが接続された状態で、以下の機能が利用できます：

- 構文エラーやセマンティックエラーのエラー波線
- 型、イベント、sync モード、メンバーアクセスのオートコンプリート
- 変数、関数、メソッドのホバー情報
- 定義へ移動
- 関数呼び出し中のシグネチャヘルプ
- ドキュメントアウトライン

## トラブルシューティング

### IntelliSense が動作しない

- `.noriconfig` 内の LSP サーバーパスが正しいことを確認してください
- **View > Output > Language Server** でログを確認してください
- Visual Studio 2022 がバージョン 17.8 以降であることを確認してください

### 型情報が表示されない

- Unity で extern カタログを生成してください（**Tools > Nori > Generate Extern Catalog**）
- `.noriconfig` 内の `--catalog` パスを更新してください
- 設定を変更した後は Visual Studio を再起動してください

### ファイルが認識されない

- **Tools > Options > Text Editor > File Extension** で `.nori` ファイル拡張子が登録されていることを確認してください
- ファイル拡張子を追加した後は Visual Studio を再起動してください
