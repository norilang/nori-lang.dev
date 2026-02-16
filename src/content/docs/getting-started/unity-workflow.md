---
title: Unity Workflow
description: Creating, adding, and managing Nori scripts inside the Unity Editor.
sidebar:
  order: 2
---

This page covers the full Unity-side workflow for working with Nori scripts: creating files, attaching them to GameObjects, reading compile output in the inspector, and using doc comments for tooltips.

## Creating a script

To create a new `.nori` file, right-click in the **Project** window and select **Create > Nori Script**. Unity creates a file called `NewNoriScript.nori` with a starter template and enters rename mode so you can type a name immediately.

The template contains a minimal program:

```rust
on Start {
    log("Hello from Nori!")
}

on Interact {
    log("You clicked me!")
}
```

You can also create `.nori` files from any text editor and save them anywhere inside `Assets/`.

## Adding a script to a GameObject

There are two ways to attach a Nori script to a GameObject:

### Drag and drop

1. Select a `.nori` file in the **Project** window.
2. Drag it onto the **Hierarchy** window.
3. Unity creates a new GameObject named after the file with a **NoriScript** component already wired up.

You can also drag onto an existing GameObject in the Hierarchy to add the script to it instead of creating a new one.

### Add Component menu

1. Select a GameObject in the scene.
2. Click **Add Component** in the Inspector and choose **Nori > Nori Script**.
3. Drag your `.nori` file from the Project window into the **Nori Source** field that appears.

Both methods automatically create a hidden UdonBehaviour behind the scenes and link it to the compiled program. You never need to configure UdonBehaviour manually.

## The inspector

When you select a GameObject with a NoriScript component, the inspector shows:

- **Status bar** — Displays "Compiled OK" when the script compiles without issues, or a summary like "2 errors, 1 warning" when there are problems.
- **Nori Source** — The `.nori` file assigned to this component. Click the field to locate the file in the Project window.
- **Source Script** — A read-only reference to the `.nori` asset.
- **Recompile** — Click to force a recompile of the script. Useful after making manual changes.
- **Compile All Nori Programs** — Recompiles every `.nori` file in the project.
- **Public Variables** — A foldout listing every `pub let` variable. Edit values here just like any other Unity component.
- **Compiled Nori Udon Assembly** — A foldout showing the generated Udon Assembly text.
- **Program Disassembly** — A foldout showing the disassembled program bytecode (requires VRChat SDK).

## Inline compile errors

When a `.nori` file contains errors or warnings, the inspector status bar shows a count like "2 errors, 1 warning". Below the status bar, a **Diagnostics** foldout lists each issue with:

- **Error code** — e.g., `N0012`
- **Line number** — the line in the `.nori` file where the problem occurs
- **Message** — a description of the issue
- **Hint** — a suggestion for how to fix it (when available)

Errors appear with a red icon, warnings with a yellow icon. Fix the issues in your text editor, save the file, and the diagnostics update automatically.

## Auto-refresh

The inspector listens for changes to `.nori` files via the Unity asset pipeline. When you save a `.nori` file in an external editor, Unity detects the change, reimports the file, and the inspector updates automatically. There is no need to click **Recompile** during normal development — just save and check the inspector.

You can also trigger a full recompile of all scripts at any time from **Tools > Nori > Compile All Nori Scripts**.

## Doc comments

Use `///` comments above a `pub let` declaration to add a description that appears as a tooltip in the Unity Inspector. When you hover over the variable's field, the tooltip shows your comment text.

```rust
/// Maximum health points for this character.
pub let max_health: int = 100

/// How fast the door opens, in degrees per second.
/// Higher values make the animation snappier.
pub let door_speed: float = 90.0
```

In the inspector, hovering over **Max Health** shows "Maximum health points for this character." and hovering over **Door Speed** shows "How fast the door opens, in degrees per second. Higher values make the animation snappier."

Doc comments only apply to the `pub let` declaration immediately below them. Blank lines between the comment and the declaration are allowed. Regular `//` comments are ignored by the tooltip system.
