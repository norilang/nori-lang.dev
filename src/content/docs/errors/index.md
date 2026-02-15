---
title: Error Index
description: Complete list of Nori compiler errors and warnings with explanations.
sidebar:
  order: 1
---

Every Nori compiler error includes an error code that links to a detailed explanation page. Use this index to find any error by code or browse by category.

### Lexer Errors

| Code | Title | Description |
|------|-------|-------------|
| [E0001](/errors/generated/e0001/) | Unterminated string literal | String opened with `"` but never closed |
| [E0002](/errors/generated/e0002/) | Unterminated block comment | Block comment `/*` without matching `*/` |
| [E0003](/errors/generated/e0003/) | Unexpected character | Invalid character in source code |

### Parser Errors

| Code | Title | Description |
|------|-------|-------------|
| [E0010](/errors/generated/e0010/) | Unexpected token at top level | Declaration must start with let, pub, sync, on, event, or fn |
| [E0011](/errors/generated/e0011/) | Expected 'let' after 'pub' | `pub` must be followed by `let` |
| [E0012](/errors/generated/e0012/) | Invalid sync mode | Sync mode must be none, linear, or smooth |
| [E0020](/errors/generated/e0020/) | Invalid send target | Send target must be All or Owner |
| [E0030](/errors/generated/e0030/) | Expected expression | Missing expression where one was expected |
| [E0031](/errors/generated/e0031/) | Unexpected token | Token doesn't match expected syntax |
| [E0032](/errors/generated/e0032/) | Expected identifier | Name expected but not found |

### Type Errors

| Code | Title | Description |
|------|-------|-------------|
| [E0040](/errors/generated/e0040/) | Type mismatch | Incompatible types in expression |
| [E0042](/errors/generated/e0042/) | Generic types not supported | .NET generics not available in Udon |

### Scope Errors

| Code | Title | Description |
|------|-------|-------------|
| [E0070](/errors/generated/e0070/) | Undefined variable | Variable not declared in current scope |
| [E0071](/errors/generated/e0071/) | Undefined function | Function not declared |

### Constraint Errors

| Code | Title | Description |
|------|-------|-------------|
| [E0100](/errors/generated/e0100/) | Recursion detected | Recursive calls not possible without call stack |

### Extern Errors

| Code | Title | Description |
|------|-------|-------------|
| [E0130](/errors/generated/e0130/) | Method not found | Method doesn't exist or no matching overload |
| [E0131](/errors/generated/e0131/) | Ambiguous overload | Multiple overloads match equally well |
| [E0132](/errors/generated/e0132/) | Property not writable | Property is read-only |
| [E0133](/errors/generated/e0133/) | Enum value not found | Enum value doesn't exist on type |

### Warnings

| Code | Title | Description |
|------|-------|-------------|
| [W0010](/errors/generated/w0010/) | Unused variable | Variable declared but never used |

If you encounter an error not listed here, please [file an issue](https://github.com/nori-lang/nori/issues).
