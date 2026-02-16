---
title: Installation
description: Get started with Nori — install the package and write your first program.
sidebar:
  order: 1
---

## What is Nori?

Nori is a programming language for building VRChat worlds that compiles to Udon Assembly. It replaces the visual node graph with readable, text-based code while giving you access to the full VRChat API. Nori enforces explicit type constraints, produces clear error messages when something goes wrong, and ships with complete API documentation so you always know what methods and types are available.

## Prerequisites

Before installing Nori, make sure you have the following:

- **VRChat Creator Companion (VCC)** — The official tool for managing VRChat Unity projects. Download it from [the VRChat website](https://vrchat.com/home/download).
- **Unity 2022.3 LTS** — The Unity version required by the current VRChat SDK. Install it through the VCC.
- **VRChat SDK (Worlds)** — The Worlds SDK package, added to your project through the VCC.

## Install via VCC

1. Click the button below to add the Nori package repository to VCC:

   **[Add to VCC](vcc://vpm/addRepo?url=https%3A%2F%2Fvcc.nori-lang.dev%2Findex.json)**

   Or, open VCC and go to **Settings > Packages**, click **Add Repository**, and paste:

   ```
   https://vcc.nori-lang.dev/index.json
   ```

2. Open your VRChat world project in VCC and click **Manage Project**.
3. Find **Nori Language** in the package list and click **Add**.

## Install via UPM

If you prefer to add the package directly inside Unity:

1. Open your project in Unity.
2. Go to **Window > Package Manager**.
3. Click the **+** button in the top-left corner and select **Add package from git URL...**.
4. Paste the following URL:

   ```
   https://github.com/norilang/nori.git?path=Packages/dev.nori.compiler
   ```

5. Click **Add**. Unity will download and install the Nori compiler package.

## Verify installation

Once the package is installed, confirm everything is working by creating a simple program.

1. Right-click in the **Project** window and select **Create > Nori Script**.
2. Rename the file to `hello.nori`. It comes with a starter template:

   ```rust
   on Start {
       log("Hello from Nori!")
   }

   on Interact {
       log("You clicked me!")
   }
   ```

3. Drag `hello.nori` from the Project window onto the **Hierarchy** to create a new GameObject.
4. Enter **Play mode**.
5. Open the **Console** window (**Window > General > Console**) and confirm you see the message: `Hello from Nori!`
6. Click the GameObject in the Game view to trigger the Interact event. You should see: `You clicked me!`

If both messages appear, Nori is installed and working correctly.

## Next steps

- [Your First World](/getting-started/your-first-world/) — Build a simple interactive VRChat world step by step.
- [Examples](/getting-started/examples/) — Annotated code examples for common VRChat world patterns.
- [Language Reference](/language/variables/) — Learn the full Nori language syntax and features.
