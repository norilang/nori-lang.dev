---
title: Visual Studio
description: Set up Visual Studio for Nori language support using the generic LSP client.
sidebar:
  order: 4
---

Visual Studio 2022 17.8+ supports generic LSP clients that work with the Nori language server.

## Prerequisites

- [Visual Studio 2022](https://visualstudio.microsoft.com/) version 17.8 or later
- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0) (to build the LSP server)

## Setup

### 1. Build the LSP server

Follow the instructions in [Building the LSP Server](../building-the-lsp/) to get a `nori-lsp.exe` binary.

You can also use the Unity Setup Wizard (**Tools > Nori > Setup Editor...**) to build the server and copy the binary path to your clipboard.

### 2. Configure the LSP client

Create a `.noriconfig` file in your solution or project root:

```json
{
  "language": "nori",
  "extensions": [".nori"],
  "lspServer": "C:\\path\\to\\nori-lsp.exe",
  "lspServerArgs": ["--catalog", "C:\\path\\to\\extern-catalog.json"]
}
```

Replace the paths with the actual locations on your system. The `--catalog` argument is optional but recommended for full VRChat API coverage.

### 3. Register the `.nori` file type

1. In Visual Studio, go to **Tools > Options > Text Editor > File Extension**
2. Add `.nori` with **Editor: Source Code (Text) Editor**
3. Click **OK** and restart Visual Studio

## Alternative: VS Code extension compatibility

Visual Studio 2022 supports some VS Code extensions through a compatibility layer. The Nori VS Code extension (in `editors~/vscode/`) may work with limited functionality through this approach, but the manual LSP configuration above is more reliable.

## Features

With the LSP server connected, you get:

- Error squiggles for syntax and semantic errors
- Autocomplete for types, events, sync modes, and member access
- Hover information for variables, functions, and methods
- Go-to-definition
- Signature help during function calls
- Document outline

## Troubleshooting

### No IntelliSense

- Verify the LSP server path in `.noriconfig` is correct
- Check **View > Output > Language Server** for logs
- Ensure Visual Studio 2022 is version 17.8 or later

### Missing type information

- Generate the extern catalog in Unity (**Tools > Nori > Generate Extern Catalog**)
- Update the `--catalog` path in `.noriconfig`
- Restart Visual Studio after changing the configuration

### File not recognized

- Ensure the `.nori` file extension is registered in **Tools > Options > Text Editor > File Extension**
- Restart Visual Studio after adding the file extension
