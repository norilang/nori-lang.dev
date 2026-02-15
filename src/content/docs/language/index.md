---
title: Language Overview
description: Overview of the Nori programming language for VRChat worlds.
sidebar:
  order: 1
---

Nori is a programming language for building VRChat worlds. It compiles to Udon Assembly, the instruction set that runs inside VRChat's Udon Virtual Machine. Instead of wiring visual node graphs, you write text-based code that the Nori compiler translates into the same output the node graph would produce.

## Design philosophy

Nori follows four principles:

- **No surprises.** The language does what it looks like it does. There are no hidden conversions, no implicit side effects, and no behaviors that change depending on context.
- **Errors are documentation.** Every error message explains what went wrong, why it happened, and what to do about it. Error codes link to full reference pages.
- **Explicitness.** Type annotations are required. Sync modes are declared at the variable. Network targets are spelled out in the send statement. You always know what the code will do at runtime.
- **Familiar but honest.** The syntax borrows from Rust, Go, and TypeScript, but it never pretends to have features that Udon cannot support. If Udon has no call stack, Nori will not fake one.

## File structure

A `.nori` file is a single UdonBehaviour. There is no `class` keyword -- the file itself is the class. Everything declared at the top level of the file becomes part of that behaviour's state and logic.

```rust
// greeting.nori — this entire file compiles to one UdonBehaviour

pub let message: string = "Hello!"
let click_count: int = 0

on Start {
    log(message)
}

on Interact {
    click_count = click_count + 1
    log("Clicked {click_count} times")
}
```

A file can contain four kinds of top-level declarations, in any order:

1. **Variables** (`let`, `pub let`, `sync`) -- the behaviour's fields
2. **Events** (`on EventName`) -- handlers for VRChat lifecycle and interaction events
3. **Custom events** (`event Name`) -- user-defined events that can be sent over the network
4. **Functions** (`fn name()`) -- reusable logic blocks

## Quick syntax tour

Here is a complete Nori program that implements a networked toggle door:

```rust
pub let speed: float = 90.0
sync none is_open: bool = false
let current_angle: float = 0.0
let target_angle: float = 0.0

on Interact {
    if Networking.IsOwner(localPlayer, gameObject) {
        is_open = !is_open
        if is_open {
            target_angle = 90.0
        } else {
            target_angle = 0.0
        }
        RequestSerialization()
    }
}

on VariableChange {
    if is_open {
        target_angle = 90.0
    } else {
        target_angle = 0.0
    }
}

on Update {
    if current_angle != target_angle {
        let step: float = speed * Time.deltaTime
        if current_angle < target_angle {
            current_angle = current_angle + step
            if current_angle > target_angle {
                current_angle = target_angle
            }
        } else {
            current_angle = current_angle - step
            if current_angle < target_angle {
                current_angle = target_angle
            }
        }
    }
}
```

This demonstrates variables with type annotations, sync declarations, built-in shortcuts (`localPlayer`, `gameObject`), static method calls (`Networking.IsOwner`), event handlers, control flow, and expressions.

## How Nori maps to Udon

The Nori compiler pipeline has five stages:

1. **Lexer** -- Tokenizes the source text into a stream of tokens.
2. **Parser** -- Builds an Abstract Syntax Tree (AST) from the token stream.
3. **Semantic Analyzer** -- Resolves types, validates names, checks for errors, and annotates the AST with Udon type information.
4. **IR Lowering** -- Translates the annotated AST into a flat intermediate representation of Udon instructions.
5. **Udon Emitter** -- Serializes the IR into Udon Assembly text that VRChat can load.

Every Nori variable becomes a heap slot in Udon's memory. Every function call becomes a `JUMP` with a return address stored in a heap variable. Every operator becomes an `EXTERN` call to a whitelisted .NET method. There is no abstraction layer between Nori and Udon -- the language is a direct, readable notation for what Udon actually does.

## Language reference

- [Variables](/language/variables/) -- `let`, `pub let`, `sync`, and type annotations
- [Types](/language/types/) -- Primitives, arrays, Unity types, and VRChat types
- [Expressions](/language/expressions/) -- Operators, member access, string interpolation, and array literals
- [Control Flow](/language/control-flow/) -- `if`/`else`, `while`, `for..in`, `break`, `continue`, `return`
- [Functions](/language/functions/) -- `fn` declarations, parameters, and return values
- [Events](/language/events/) -- Built-in VRChat event handlers
- [Custom Events](/language/custom-events/) -- User-defined events and network sends
- [Networking](/language/networking/) -- Ownership, synced variables, and serialization
- [Limitations](/language/limitations/) -- What Nori cannot do and why
