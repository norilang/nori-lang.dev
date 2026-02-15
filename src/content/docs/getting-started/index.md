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

1. Open the **VRChat Creator Companion**.
2. Go to **Settings > Packages** and click **Add Repository**.
3. Paste the following git URL:

   ```
   https://github.com/nori-lang/nori.git?path=Packages/dev.nori.compiler
   ```

4. Click **Add**. The Nori package will now appear in your package list.
5. Open your VRChat world project and click **Manage Project**.
6. Find **Nori Compiler** in the package list and click **Add**.

## Install via UPM

If you prefer to add the package directly inside Unity:

1. Open your project in Unity.
2. Go to **Window > Package Manager**.
3. Click the **+** button in the top-left corner and select **Add package from git URL...**.
4. Paste the following URL:

   ```
   https://github.com/nori-lang/nori.git?path=Packages/dev.nori.compiler
   ```

5. Click **Add**. Unity will download and install the Nori compiler package.

## Verify installation

Once the package is installed, confirm everything is working by creating a simple program.

1. In your Unity **Assets** folder, create a new file called `hello.nori`.
2. Open it in a text editor and paste the following code:

   ```rust
   on Start {
       log("Hello from Nori!")
   }

   on Interact {
       log("You clicked me!")
   }
   ```

3. In the Unity scene, create a new **GameObject** (e.g., a Cube).
4. Add an **UdonBehaviour** component to the GameObject.
5. Assign the compiled Nori program to the UdonBehaviour.
6. Enter **Play mode**.
7. Open the **Console** window (**Window > General > Console**) and confirm you see the message: `Hello from Nori!`
8. Click the GameObject in the Game view to trigger the Interact event. You should see: `You clicked me!`

If both messages appear, Nori is installed and working correctly.

## Next steps

- [Your First World](/getting-started/your-first-world/) — Build a simple interactive VRChat world step by step.
- [Examples](/getting-started/examples/) — Annotated code examples for common VRChat world patterns.
- [Language Reference](/language/variables/) — Learn the full Nori language syntax and features.
