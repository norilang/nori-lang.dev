---
title: JetBrains Rider
description: Set up JetBrains Rider for Nori language support using its built-in LSP client.
sidebar:
  order: 3
---

JetBrains Rider 2023.2+ includes a built-in LSP client that works with the Nori language server.

## Prerequisites

- [JetBrains Rider](https://www.jetbrains.com/rider/) 2023.2 or later
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (to build the LSP server)

## Setup

### 1. Build the LSP server

Follow the instructions in [Building the LSP Server](../building-the-lsp/) to get a `nori-lsp` binary for your platform.

You can also use the Unity Setup Wizard (**Tools > Nori > Setup Editor...**) to build the server and copy the binary path to your clipboard.

### 2. Configure Rider's LSP client

1. Open **Settings > Languages & Frameworks > Language Servers**
2. Click **Add** (+) to create a new configuration
3. Set the following:
   - **Name:** `Nori`
   - **Server executable:** path to the `nori-lsp` binary
   - **File patterns:** `*.nori`
   - **Arguments:** `--catalog /path/to/extern-catalog.json` (optional but recommended)

### 3. Add syntax highlighting

Rider supports TextMate grammars via the **TextMate Bundles** plugin:

1. Install the **TextMate Bundles** plugin from the JetBrains Marketplace
2. Go to **Settings > Editor > TextMate Bundles**
3. Click **Add** and select the `editors~/vscode/` directory from the Nori package (it contains the `.tmLanguage.json` grammar)
4. Restart Rider

### 4. Register the `.nori` file type

If `.nori` files aren't automatically recognized:

1. Go to **Settings > Editor > File Types**
2. Under **Recognized File Types**, click **Add** (+)
3. Name the file type `Nori` and add `*.nori` as a pattern

## Features

With the LSP server running, you get:

- Error diagnostics (red underlines) within ~200ms
- Autocomplete after `.` (type members), `:` (types), `on` (events)
- Hover info showing types, signatures, and extern mappings
- Go-to-definition for variables, functions, and custom events
- Signature help during function/method calls
- Document outline showing all declarations

## Troubleshooting

### Server not starting

- Check the Rider Event Log for errors (**View > Tool Windows > Event Log**)
- On macOS/Linux, ensure the binary has execute permissions: `chmod +x nori-lsp`
- Verify the server binary runs manually: `./nori-lsp --help`

### No syntax highlighting

- Verify the TextMate Bundles plugin is installed and enabled
- Check that the bundle path points to the `editors~/vscode/` directory containing `syntaxes/nori.tmLanguage.json`
- Restart Rider after adding the bundle

### Missing type information

- Generate the extern catalog in Unity (**Tools > Nori > Generate Extern Catalog**)
- Pass `--catalog /path/to/catalog.json` in the Language Server arguments
- Restart the language server after changing the catalog path
