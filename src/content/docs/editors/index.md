---
title: Editor Setup
description: Set up your editor for Nori language support with diagnostics, autocomplete, and more.
sidebar:
  order: 1
---

Nori includes a Language Server Protocol (LSP) server that provides rich editor features for `.nori` files. With editor support configured, you get real-time feedback as you write code — no need to switch to Unity to see errors.

## Features

The Nori LSP server provides:

- **Diagnostics** — syntax and semantic errors appear as red underlines within ~200ms of typing
- **Autocomplete** — suggestions after `.` (type members), `:` (types), and `on` (events)
- **Hover information** — see types, function signatures, and extern mappings by hovering over identifiers
- **Go-to-definition** — jump to variable, function, and custom event declarations
- **Signature help** — parameter hints while typing function and method calls
- **Document outline** — see all declarations in the current file at a glance

## Supported editors

| Feature | VS Code | JetBrains Rider | Visual Studio |
|---------|:-------:|:---------------:|:-------------:|
| Diagnostics | Yes | Yes | Yes |
| Autocomplete | Yes | Yes | Yes |
| Hover info | Yes | Yes | Yes |
| Go-to-definition | Yes | Yes | Yes |
| Signature help | Yes | Yes | Yes |
| Document outline | Yes | Yes | Yes |
| Syntax highlighting | Yes (TextMate) | Yes (TextMate) | Basic |
| Snippets | Yes | — | — |
| One-click install | Yes (extension) | — | — |

**VS Code** has the best out-of-the-box experience thanks to a dedicated extension that bundles the TextMate grammar, snippets, and LSP client configuration. Rider and Visual Studio work well through their built-in generic LSP client support.

## Quick start

The fastest way to get set up is from Unity:

1. Open your Unity project
2. Go to **Tools > Nori > Setup Editor...**
3. Pick your editor and follow the steps in the wizard

For manual setup, see the per-editor guides:

- [VS Code](./vscode/)
- [JetBrains Rider](./rider/)
- [Visual Studio](./visual-studio/)

All editors require the LSP server binary. See [Building the LSP Server](./building-the-lsp/) for build instructions.

## Architecture

The LSP server is a standalone .NET 8 console application (`nori-lsp`) that communicates with editors over stdin/stdout using the Language Server Protocol. It reuses the same compiler pipeline (lexer, parser, semantic analyzer) that runs inside Unity, so diagnostics are identical in your editor and in the Unity console.

The server accepts an optional `--catalog` flag pointing to an extern catalog JSON file. This catalog describes all available VRChat SDK types and methods, enabling richer autocomplete and type checking. Generate the catalog in Unity via **Tools > Nori > Generate Extern Catalog**.
