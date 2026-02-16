---
title: LSP サーバーのビルド
description: お使いのプラットフォーム向けに Nori LSP サーバーバイナリをビルドします。
sidebar:
  order: 5
---

すべてのエディター統合には Nori LSP サーバーバイナリ（`nori-lsp`）が必要です。このページではそのビルド方法を説明します。

## Unity からビルド（推奨）

サーバーをビルドする最も簡単な方法は Unity エディターから行うことです。セットアップウィザードが、バイナリのビルド、extern カタログの生成、および両方のパブリッシュディレクトリへのコピーを一度に行います。

1. Unity プロジェクトを開きます
2. **Tools > Nori > Setup Editor...** に移動します
3. **Build LSP Server** をクリックします

ウィザードが自動的に以下を実行します：
- VRC SDK（インストールされている場合）から extern カタログを生成します
- お使いのプラットフォーム向けの自己完結型バイナリをビルドします
- エディターが見つけられるように、カタログをバイナリの隣にコピーします

生成されたバイナリのパスが表示され、クリップボードにコピーできます。

:::tip
ビルド後に VRC SDK が更新された場合、Unity はコンソールと Nori 設定パネルに再ビルドを促す警告を表示します。**Build LSP Server** をもう一度クリックして、すべてを再生成してください。
:::

## コマンドラインからのビルド

Unity の外部でビルドする場合は、[.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) 以降が必要です。

インストールを確認します：

```bash
dotnet --version
# 8.0.x 以降が表示されるはずです
```

LSP サーバーのソースは、Nori パッケージディレクトリ内の `tools~/Nori.Lsp/` にあります。`tools~` ディレクトリに移動し、以下を実行します：

import { Tabs, TabItem } from '@astrojs/starlight/components';

<Tabs>
  <TabItem label="Windows">
```bash
cd tools~
dotnet publish Nori.Lsp/Nori.Lsp.csproj -r win-x64 -c Release
```

出力先: `Nori.Lsp/bin/Release/net8.0/win-x64/publish/nori-lsp.exe`
  </TabItem>
  <TabItem label="macOS (Intel)">
```bash
cd tools~
dotnet publish Nori.Lsp/Nori.Lsp.csproj -r osx-x64 -c Release
```

出力先: `Nori.Lsp/bin/Release/net8.0/osx-x64/publish/nori-lsp`
  </TabItem>
  <TabItem label="macOS (Apple Silicon)">
```bash
cd tools~
dotnet publish Nori.Lsp/Nori.Lsp.csproj -r osx-arm64 -c Release
```

出力先: `Nori.Lsp/bin/Release/net8.0/osx-arm64/publish/nori-lsp`
  </TabItem>
  <TabItem label="Linux">
```bash
cd tools~
dotnet publish Nori.Lsp/Nori.Lsp.csproj -r linux-x64 -c Release
```

出力先: `Nori.Lsp/bin/Release/net8.0/linux-x64/publish/nori-lsp`
  </TabItem>
</Tabs>

publish コマンドは、.NET ランタイムを含む自己完結型の単一ファイルバイナリを生成します。ターゲットマシンに追加の依存関係は必要ありません。

:::note
CLI ビルドでは extern カタログは自動生成されません。Unity で別途生成し（下記参照）、`--catalog` でサーバーに渡す必要があります。
:::

## extern カタログ

LSP サーバーは `--catalog` フラグを受け付けます：

```bash
nori-lsp --catalog /path/to/extern-catalog.json
```

extern カタログは、Udon で利用可能なすべての VRChat SDK の型、メソッド、プロパティ、列挙型を記述した JSON ファイルです。カタログがない場合、サーバーは限定的な API カバレッジ（約 50 の一般的な extern）を持つ組み込みカタログを使用します。完全なカタログがあれば、VRChat API 全体に対する完全なオートコンプリートと型チェックが利用できます。

**Unity からビルドした場合**、カタログは自動的に生成されてバイナリの隣にコピーされるため、追加の手順は不要です。

### カタログの手動生成

CLI からビルドした場合は、Unity でカタログを生成します：

1. **Tools > Nori > Generate Extern Catalog** に移動します（または **Project Settings > Nori** を開いて **Generate Catalog from VRC SDK** をクリックします）
2. カタログ JSON ファイルは `ProjectSettings/NoriCatalog.json` に保存されます

カタログはエディター時に VRChat SDK アセンブリをリフレクションで解析して生成されるため、常にプロジェクト内の SDK バージョンと一致します。VRC SDK が更新されると、Unity はカタログの再生成を促す警告をログに出力します。

### エディターへのカタログの渡し方

各エディターには、LSP サーバーに `--catalog` 引数を渡す独自の方法があります：

- **VS Code:** 拡張機能設定の `nori.catalog.path` を設定します
- **Rider:** Language Server の引数に `--catalog /path/to/catalog.json` を追加します
- **Visual Studio:** `.noriconfig` の `lspServerArgs` に追加します

詳細は各エディターのセットアップガイドをご覧ください。
