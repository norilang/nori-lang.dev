---
title: VS Code
description: Set up VS Code for Nori language support with the dedicated extension.
sidebar:
  order: 2
---

VS Code has the richest Nori editing experience thanks to a dedicated extension that includes syntax highlighting, snippets, and a built-in LSP client.

## Prerequisites

- [VS Code](https://code.visualstudio.com/) 1.80 or later
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (to build the LSP server)
- [Node.js](https://nodejs.org/) 18+ (to package the extension)

## Setup

### Option A: Unity Setup Wizard (recommended)

1. In Unity, go to **Tools > Nori > Setup Editor...**
2. Select the **VS Code** tab
3. Click **Build LSP Server** — this compiles the server for your platform
4. Click **Install VS Code Extension** — this packages and installs the extension
5. Open your project in VS Code

### Option B: Manual setup

#### 1. Build the LSP server

Follow the instructions in [Building the LSP Server](../building-the-lsp/) to get a `nori-lsp` binary for your platform.

#### 2. Package and install the extension

```bash
cd editors~/vscode
npm install
npm run package
```

This produces a `.vsix` file. Install it:

```bash
code --install-extension nori-lang-0.1.0.vsix
```

#### 3. Configure extension settings

Open VS Code settings (Ctrl+Comma) and search for "Nori":

- **Nori: Lsp Path** — set to the full path of the `nori-lsp` binary (e.g., `C:\nori-project\Packages\dev.nori.compiler\tools~\Nori.Lsp\bin\Release\net8.0\win-x64\publish\nori-lsp.exe`)
- **Nori: Catalog Path** — set to the path of your extern catalog JSON file (optional, but recommended for full API coverage)

Or add to your `settings.json`:

```json
{
  "nori.lsp.path": "/path/to/nori-lsp",
  "nori.catalog.path": "/path/to/extern-catalog.json"
}
```

#### 4. Generate the extern catalog

In Unity, go to **Tools > Nori > Generate Extern Catalog** (or click the button in **Project Settings > Nori**). This scans the VRChat SDK via reflection and writes a JSON file with all available types and methods.

## What you'll see

Once configured, `.nori` files in VS Code will have:

- **Syntax highlighting** — keywords, strings, numbers, comments, and type names are colored using the bundled TextMate grammar
- **Error squiggles** — red underlines appear under syntax errors and semantic issues as you type
- **Autocomplete popups** — type `.` after an expression to see available members, or type `on` to see event names
- **Hover tooltips** — hover over any identifier to see its type, or over a method call to see the extern signature
- **Go-to-definition** — Ctrl+Click (Cmd+Click on macOS) on a variable or function name to jump to its declaration
- **Signature help** — when typing arguments inside `()`, a popup shows parameter names and types
- **Outline view** — the Explorer sidebar shows all variables, functions, and events in the current file

## Troubleshooting

### Extension not activating

- Ensure the file has a `.nori` extension
- Check the VS Code output panel: **View > Output**, then select **Nori** from the dropdown
- Verify the extension is installed: run `code --list-extensions | grep nori` in a terminal

### LSP server not starting

- Check that `nori.lsp.path` points to a valid binary
- On macOS/Linux, ensure the binary has execute permissions: `chmod +x nori-lsp`
- Open **View > Output > Nori** for server startup logs

### No autocomplete for VRChat types

- Generate the extern catalog in Unity (**Tools > Nori > Generate Extern Catalog**)
- Set `nori.catalog.path` to the generated JSON file
- Restart VS Code after changing the catalog path

### Errors not matching Unity

- Make sure the LSP server and Unity are using the same extern catalog file
- Rebuild the LSP server if you've updated the Nori compiler package
