---
title: コンパイル
description: Noriの各構文がUdon Assemblyにどのように変換されるか -- 変数、イベント、関数、式。
sidebar:
  order: 3
---

このページでは、Nori言語の各構文がどのようにUdon Assemblyに変換されるかを説明します。このマッピングを理解することは、デバッグ、パフォーマンスチューニング、そしてコンパイラが実際にコードに対して何をしているかを知るのに役立ちます。

## パイプラインの概要

Noriコンパイラには5つのステージがあります。各ステージは前のステージの出力を受け取り、より具体的な表現を生成します:

1. **字句解析器（Lexer）** -- ソーステキストを1文字ずつ読み取り、トークン（キーワード、識別子、リテラル、演算子、句読点）のフラットなストリームを生成します。
2. **構文解析器（Parser）** -- トークンストリームを消費し、抽象構文木（AST）-- プログラムの構文構造を表すツリー構造 -- を構築します。
3. **意味解析器（Semantic Analyzer）** -- ASTを走査して型を解決し、名前を検証し、エラーをチェックし、ノードにUdon型情報を付与します。型の不一致、未定義の変数、再帰はこのステージで検出されます。
4. **IR変換（IR Lowering）** -- 注釈付きASTを、Udonレベルの命令のフラットな中間表現（IR）に変換します。このステージでヒープ変数の割り当て、一時変数の生成、制御フローのラベル付きブロックとジャンプへの線形化が行われます。
5. **Udonエミッタ（Udon Emitter）** -- IRを最終的なUdon Assemblyテキストにシリアライズします。このステージですべてのラベルのバイトオフセットを計算し、ジャンプアドレスを具体的な数値に解決します。

```
  Source code (.nori)
        |
    [ Lexer ]          tokens
        |
    [ Parser ]          AST
        |
    [ Analyzer ]        annotated AST + diagnostics
        |
    [ IR Lowering ]     IrModule (blocks + heap vars)
        |
    [ Emitter ]         Udon Assembly text (.uasm)
```

## 変数

Noriのすべての変数は、データセクションのヒープスロットになります。Udonにはローカル変数がなく、ヒープが唯一のストレージです。

### `let`

`let` 宣言は、名前、型、初期値を持つ単一のヒープエントリを作成します:

```rust
let count: int = 0
```

```
count: %SystemInt32, 0
```

### `pub let`

`pub` を追加すると `.export` ディレクティブが追加され、変数がUnity Inspectorで表示されるようになります:

```rust
pub let speed: float = 90.0
```

```
.export speed
speed: %SystemSingle, 90
```

### `sync`

`sync` 宣言は、補間モード付きの `.sync` ディレクティブを追加します:

```rust
sync none score: int = 0
```

```
.sync score, none
score: %SystemInt32, 0
```

### ローカル変数

イベントハンドラや関数内で宣言された変数も、モジュールレベルのヒープエントリになります。Udonにはアセンブリレベルでのスコープの概念がありません:

```rust
on Update {
    let step: float = speed * Time.deltaTime
}
```

変数 `step` は他の変数と同じトップレベルのヒープエントリになります:

```
step: %SystemSingle, null
```

`step` は実行時に計算されるため、データセクションの初期値は `null` です。実際の値は毎フレーム `COPY` 命令によって設定されます。

### 一時変数

コンパイラは、式のすべての中間値に対して一時的なヒープスロットを生成します。これらは `__tmp_N_Type` と命名されます:

```rust
let result: int = a + b * c
```

この式には `b * c` の部分式用の一時変数が必要です:

```
__tmp_0_SystemInt32: %SystemInt32, null    // holds b * c
__tmp_1_SystemInt32: %SystemInt32, null    // holds a + (b * c)
```

## イベント

イベントはコードセクション内のエクスポートされたラベルです。VRChatランタイムはこれらのラベルをエントリポイントとして使用します -- ワールドで何かが起こると、VRChatは対応するラベルにジャンプします。

### 名前のマッピング

Noriのイベント名はUdonラベルに対応します:

| Noriイベント          | Udonラベル             |
|---------------------|------------------------|
| `on Start`          | `_start`               |
| `on Update`         | `_update`              |
| `on LateUpdate`     | `_lateUpdate`          |
| `on FixedUpdate`    | `_fixedUpdate`         |
| `on Interact`       | `_interact`            |
| `on Enable`         | `_onEnable`            |
| `on Disable`        | `_onDisable`           |
| `on Pickup`         | `_onPickup`            |
| `on Drop`           | `_onDrop`              |
| `on PlayerJoined`   | `_onPlayerJoined`      |
| `on PlayerLeft`     | `_onPlayerLeft`        |
| `on TriggerEnter`   | `_onTriggerEnter`      |
| `on TriggerExit`    | `_onTriggerExit`       |
| `on CollisionEnter` | `_onCollisionEnter`    |
| `on VariableChange` | `_onDeserialization`   |
| `on PreSerialization`  | `_onPreSerialization` |
| `on PostSerialization` | `_onPostSerialization`|

### Haltセンチネル

すべてのイベントハンドラは `JUMP, 0xFFFFFFFC` で終わります。これはhaltセンチネルで、ハンドラが終了し制御がVRChatに戻るべきことをVMに伝える特殊アドレスです:

```rust
on Start {
    log("Hello!")
}
```

```
.export _start

_start:
    PUSH, __const_0_SystemString
    EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"
    JUMP, 0xFFFFFFFC
```

### カスタムイベント

`event` キーワードで定義されたカスタムイベントもエクスポートされたラベルになります。同じhaltセンチネルで終了します:

```rust
event AddPoint {
    score = score + 1
}
```

```
.export AddPoint

AddPoint:
    PUSH, score
    PUSH, __const_1_SystemInt32
    PUSH, __tmp_0_SystemInt32
    EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"
    PUSH, __tmp_0_SystemInt32
    PUSH, score
    COPY
    JUMP, 0xFFFFFFFC
```

## 関数

Udonにはコールスタック、スタックフレーム、`CALL` 命令がありません。Noriコンパイラは、`JUMP` と `JUMP_INDIRECT` を使用し、ヒープ変数に格納されたリターンアドレスで関数呼び出しをシミュレートします。

### インフラストラクチャ

各関数は3種類のヒープ変数を持ちます:

- **`__retaddr_funcName`** -- 関数の実行完了後にジャンプして戻るバイトオフセット（リターンアドレス）を格納する `SystemUInt32`。
- **`__param_funcName_paramName`** -- パラメータごとに1スロット。関数に引数を渡すために使用されます。
- **`__retval_funcName`** -- 戻り値用のスロット（関数が値を返す場合のみ）。

### 呼び出しシーケンス

関数が呼び出されると、コンパイラは以下を出力します:

1. 引数をパラメータスロット（`__param_funcName_paramName`）に**コピー**
2. **リターンアドレス**を `__retaddr_funcName` に格納（呼び出し後の命令のバイトオフセット）
3. 関数のラベル（`__fn_funcName`）に **`JUMP`**

```rust
fn add(a: int, b: int): int {
    return a + b
}

on Start {
    let result: int = add(3, 5)
}
```

`_start` 内の呼び出し箇所は以下のようになります:

```
# Copy arguments to parameter slots
PUSH, __const_3                        // literal 3
PUSH, __param_add_a
COPY
PUSH, __const_5                        // literal 5
PUSH, __param_add_b
COPY

# Store return address and jump
PUSH, __const_retaddr                  // byte offset of __ret_add_0
PUSH, __retaddr_add
COPY
JUMP, 0x________                       // jump to __fn_add
```

### リターンシーケンス

関数本体の末尾（または `return` 文）で、コンパイラは以下を出力します:

1. 結果を `__retval_funcName` に**コピー**（値を返す場合）
2. `__retaddr_funcName` に格納されたアドレスへ **`JUMP_INDIRECT`**

```
__fn_add:
    # Copy param slots to local names
    PUSH, __param_add_a
    PUSH, a
    COPY
    PUSH, __param_add_b
    PUSH, b
    COPY

    # Compute a + b
    PUSH, a
    PUSH, b
    PUSH, __tmp_0_SystemInt32
    EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"

    # Copy result to return slot
    PUSH, __tmp_0_SystemInt32
    PUSH, __retval_add
    COPY

    # Return to caller
    PUSH, __retaddr_add
    JUMP_INDIRECT, __retaddr_add
```

`JUMP_INDIRECT` の後、呼び出し元のリターンラベルから実行が続行され、`__retval_add` から戻り値がコピーされます。

### なぜ再帰が不可能なのか

リターンアドレスは単一のヒープ変数に格納されます。関数 `foo` が自分自身を呼び出すと、2回目の呼び出しが `__retaddr_foo` を新しいリターンアドレスで上書きし、元のアドレスを破壊します。内側の呼び出しは正しい場所に戻りますが、外側の呼び出しが戻ろうとした時にはアドレスが失われています。これが、コンパイラがコンパイル時に再帰を検出して拒否する理由です。

## 式

すべてのNori式は、ヒープスロットを操作する `PUSH`、`EXTERN`、`COPY` 命令のシーケンスにコンパイルされます。

### 算術演算

二項演算子は、2つのオペランドと結果用の一時変数でextern呼び出しにコンパイルされます:

```rust
let x: int = a + b
```

```
PUSH, a
PUSH, b
PUSH, __tmp_0_SystemInt32
EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"
PUSH, __tmp_0_SystemInt32
PUSH, x
COPY
```

### 比較

比較も同じ方法で動作しますが、`SystemBoolean` の結果を生成します:

```rust
if a > b { ... }
```

```
PUSH, a
PUSH, b
PUSH, __tmp_0_SystemBoolean
EXTERN, "SystemInt32.__op_GreaterThan__SystemInt32_SystemInt32__SystemBoolean"
PUSH, __tmp_0_SystemBoolean
JUMP_IF_FALSE, 0x________
```

### メンバーアクセス（プロパティ）

プロパティの読み取りはgetterのexternにコンパイルされます。インスタンスプロパティの場合、オブジェクトが最初にプッシュされます:

```rust
let pos: Vector3 = transform.position
```

```
PUSH, __this_UnityEngineTransform_0
PUSH, __tmp_0_UnityEngineVector3
EXTERN, "UnityEngineTransform.__get_position__UnityEngineVector3"
PUSH, __tmp_0_UnityEngineVector3
PUSH, pos
COPY
```

静的プロパティの場合、オブジェクトのプッシュはありません:

```rust
let dt: float = Time.deltaTime
```

```
PUSH, __tmp_0_SystemSingle
EXTERN, "UnityEngineTime.__get_deltaTime__SystemSingle"
PUSH, __tmp_0_SystemSingle
PUSH, dt
COPY
```

### メソッド呼び出し

インスタンスメソッド呼び出しは、オブジェクト、引数、結果スロット（void以外の場合）の順にプッシュします:

```rust
gameObject.SetActive(false)
```

```
PUSH, __this_UnityEngineGameObject_0
PUSH, __const_false
EXTERN, "UnityEngineGameObject.__SetActive__SystemBoolean__SystemVoid"
```

### 文字列補間

文字列補間は、`ToString` と `Concat` のextern呼び出しのチェーンにコンパイルされます:

```rust
log("Score: {score}")
```

各 `{expr}` は `SystemObject.__ToString__SystemString` で文字列に変換され、前後のリテラル部分と `SystemString.__Concat__SystemString_SystemString__SystemString` で連結されます:

```
# "Score: " is a string constant
# {score} -> ToString
PUSH, score
PUSH, __tmp_0_SystemString
EXTERN, "SystemObject.__ToString__SystemString"

# Concatenate
PUSH, __const_prefix                     // "Score: "
PUSH, __tmp_0_SystemString
PUSH, __tmp_1_SystemString
EXTERN, "SystemString.__Concat__SystemString_SystemString__SystemString"

# Log the result
PUSH, __tmp_1_SystemString
EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"
```

### ブールリテラル

Udonのデータセクションはブール値 `true` を表現できません -- すべてのブールヒープスロットは `null` に初期化され、VMはこれを `false` として扱います。Noriコンパイラは、実行時にブール否定を使って `true` を計算することで回避しています:

```rust
let flag: bool = true
```

データセクションでは、変数は `null` で初期化されます:

```
flag: %SystemBoolean, null
```

実行時に、コンパイラは `_start` の先頭に `false` を否定して `true` を生成する初期化コードを挿入します:

```
PUSH, __const_false                  // null (= false)
PUSH, __tmp_0_SystemBoolean
EXTERN, "SystemBoolean.__op_UnaryNegation__SystemBoolean__SystemBoolean"
PUSH, __tmp_0_SystemBoolean
PUSH, flag
COPY
```

### 複合代入

複合代入演算子（`+=`、`-=`、`*=`、`/=`）は、読み取り・計算・書き込みのシーケンスにコンパイルされます:

```rust
count += 1
```

```
PUSH, count
PUSH, __const_1
PUSH, __tmp_0_SystemInt32
EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"
PUSH, __tmp_0_SystemInt32
PUSH, count
COPY
```

プロパティへの複合代入（`transform.position += offset` など）の場合、コンパイラはgetter呼び出し、計算、setter呼び出しを出力します。

## 制御フロー

### if / else

`if` 文は、then本体をスキップする `JUMP_IF_FALSE` にコンパイルされます。`else` 分岐がある場合、then本体の末尾にelse本体をスキップする無条件 `JUMP` が追加されます:

```rust
if is_open {
    target_angle = 90.0
} else {
    target_angle = 0.0
}
```

```
    PUSH, is_open
    JUMP_IF_FALSE, 0x________        // jump to __else_0

    # then body
    PUSH, __const_90
    PUSH, target_angle
    COPY
    JUMP, 0x________                 // jump to __endif_1

__else_0:
    # else body
    PUSH, __const_0
    PUSH, target_angle
    COPY

__endif_1:
    # execution continues
```

### while

`while` ループは、条件チェック、ループ末尾への `JUMP_IF_FALSE`、本体、条件への無条件 `JUMP` にコンパイルされます:

```rust
while count < 10 {
    count = count + 1
}
```

```
    JUMP, 0x________                 // jump to __while_cond_0

__while_cond_0:
    PUSH, count
    PUSH, __const_10
    PUSH, __tmp_0_SystemBoolean
    EXTERN, "SystemInt32.__op_LessThan__SystemInt32_SystemInt32__SystemBoolean"
    PUSH, __tmp_0_SystemBoolean
    JUMP_IF_FALSE, 0x________        // jump to __while_end_1

    # body
    PUSH, count
    PUSH, __const_1
    PUSH, __tmp_1_SystemInt32
    EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"
    PUSH, __tmp_1_SystemInt32
    PUSH, count
    COPY

    JUMP, 0x________                 // jump to __while_cond_0

__while_end_1:
```

### for..in range

`for i in 0..10` ループは、明示的なカウンタ変数と末尾のインクリメントステップを持つwhileループとしてコンパイルされます:

```rust
for i in 0..10 {
    log("{i}")
}
```

```
    # Initialize counter
    PUSH, __const_0
    PUSH, i
    COPY

    JUMP, 0x________                 // jump to __for_cond_0

__for_cond_0:
    # Check i < 10
    PUSH, i
    PUSH, __const_10
    PUSH, __tmp_0_SystemBoolean
    EXTERN, "SystemInt32.__op_LessThan__SystemInt32_SystemInt32__SystemBoolean"
    PUSH, __tmp_0_SystemBoolean
    JUMP_IF_FALSE, 0x________        // jump to __for_end_2

    # body
    ...

__for_incr_1:
    # i = i + 1
    PUSH, i
    PUSH, __const_1
    PUSH, __tmp_1_SystemInt32
    EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"
    PUSH, __tmp_1_SystemInt32
    PUSH, i
    COPY
    JUMP, 0x________                 // jump to __for_cond_0

__for_end_2:
```

### break と continue

`break` はループの末尾ラベルへの `JUMP` にコンパイルされます。`continue` はループの条件ラベル（`for` ループではインクリメントラベル）への `JUMP` にコンパイルされます:

```rust
while true {
    if done {
        break       // JUMP to __while_end_N
    }
    continue        // JUMP to __while_cond_N
}
```

### return

イベントハンドラ内では、`return` は `JUMP, 0xFFFFFFFC`（haltセンチネル）にコンパイルされ、ハンドラを早期に終了します。関数内では、`return` は結果を `__retval_funcName` にコピーし、格納されたリターンアドレスへ `JUMP_INDIRECT` を実行します。
