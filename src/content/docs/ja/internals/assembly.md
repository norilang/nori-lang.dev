---
title: アセンブリ形式
description: Noriコンパイラが出力するUdon Assemblyの注釈付きウォークスルー。
sidebar:
  order: 2
---

NoriコンパイラはUdon Assemblyを出力します -- VRChatが実行時にUdon VMに読み込むテキスト形式です。各 `.nori` ファイルは、ヒープ変数をすべて宣言するデータセクションと、命令を含むコードセクションの2つのセクションからなる単一の `.uasm` 出力ファイルを生成します。

## 構造

すべてのUdon Assemblyファイルは同じ構造に従います:

```
.data_start
    // Variable exports, sync directives, and heap declarations
.data_end

.code_start
    // Code exports, labels, and instructions
.code_end
```

データセクションが最初に来て、プログラムが使用するすべてのヒープ変数を宣言します。コードセクションがその後に続き、VMが実行する実際の命令を含みます。

## データセクション

データセクションは、ヒープに存在するすべての変数を宣言します。これには、ユーザーが宣言した変数、コンパイラが生成した一時変数、定数が含まれます。

### 変数宣言

各変数宣言には、名前、型（`%` 接頭辞付き）、初期値があります:

```
.data_start

    speed: %SystemSingle, 90
    is_open: %SystemBoolean, null
    current_angle: %SystemSingle, 0
    __const_0_SystemString: %SystemString, "Hello from Nori!"
    __tmp_0_SystemSingle: %SystemSingle, null

.data_end
```

- **ユーザー変数**は元の名前を保持します: `speed`、`is_open`、`current_angle`。
- **定数**は `__const_` に続いてカウンタと型が付きます: `__const_0_SystemString`。
- **一時変数**は `__tmp_` に続いてカウンタと型が付きます: `__tmp_0_SystemSingle`。式の中間結果を保持します。
- **関数インフラ**変数は `__retaddr_`、`__param_`、または `__retval_` が接頭辞として付きます。

型はUdonの命名規則を使用します: .NET名前空間からドットを除去。`System.String` は `SystemString` に、`UnityEngine.Vector3` は `UnityEngineVector3` になります。

### エクスポートディレクティブ

`.export` ディレクティブは、変数をUnity Inspectorに表示されるようにマークします。Noriでは、`pub let` がエクスポートを生成します:

```rust
pub let speed: float = 90.0
```

```
.data_start

    .export speed
    speed: %SystemSingle, 90

.data_end
```

### Syncディレクティブ

`.sync` ディレクティブは、変数をネットワーク同期対象としてマークします。Noriでは、`sync` キーワードが補間モード付きのsyncディレクティブを生成します:

```rust
sync none score: int = 0
sync linear position: float = 0.0
sync smooth rotation: float = 0.0
```

```
.data_start

    .sync score, none
    .sync position, linear
    .sync rotation, smooth

    score: %SystemInt32, 0
    position: %SystemSingle, 0
    rotation: %SystemSingle, 0

.data_end
```

### コンパイラ生成変数

コンパイラはいくつかの種類の隠し変数を生成します:

- **`__this_*`** -- 現在のUdonBehaviour、そのGameObject、そのTransformへの参照。これらは `null` ではなく `this` で初期化されます。
- **`__const_*`** -- 重複排除された定数。文字列 `"Hello"` を3回使用しても、作成される `__const_N_SystemString` は1つだけです。
- **`__tmp_*`** -- 式の結果用の一時変数。各部分式が専用の一時スロットを持ちます。
- **`__retaddr_funcName`** -- 関数呼び出しのリターンアドレスを格納します。
- **`__param_funcName_paramName`** -- 関数呼び出しのパラメータ受け渡しスロット。
- **`__retval_funcName`** -- 値を返す関数の戻り値スロット。

## コードセクション

コードセクションにはラベルと命令が含まれます。ラベルにはエクスポートされたもの（イベントのエントリポイントとしてVRChatに公開される）と内部的なもの（プログラム内のジャンプに使用される）があります。

### エクスポート

コードセクションの `.export` ディレクティブは、ラベルをイベントエントリポイントとしてマークします。VRChatはこれらを使用して、イベント発生時にどこにジャンプするかを判断します:

```
.code_start

    .export _start
    .export _interact

.code_end
```

### 命令

命令はラベルの下にインデントされます。各命令は、オペコードとオペランドのカンマ区切りペアです:

```
.code_start

    .export _start

    _start:
        PUSH, __const_0_SystemString
        EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"
        JUMP, 0xFFFFFFFC

.code_end
```

## Hello Worldウォークスルー

最もシンプルなNoriプログラムの完全なアセンブリ出力を示します:

```rust
on Start {
    log("Hello from Nori!")
}
```

コンパイル結果:

```
.data_start

    __this_VRCUdonCommonInterfacesIUdonEventReceiver_0: %VRCUdonCommonInterfacesIUdonEventReceiver, this
    __this_UnityEngineGameObject_0: %UnityEngineGameObject, this
    __this_UnityEngineTransform_0: %UnityEngineTransform, this
    __const_0_SystemString: %SystemString, "Hello from Nori!"

.data_end

.code_start

    .export _start

    _start:
        PUSH, __const_0_SystemString
        EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"
        JUMP, 0xFFFFFFFC

.code_end
```

命令を順に追っていきます:

1. **`PUSH, __const_0_SystemString`** -- 文字列定数 `"Hello from Nori!"` のヒープアドレスを整数スタックにプッシュします。
2. **`EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"`** -- `Debug.Log` を呼び出します。externはスタックから1つのアドレス（メッセージ引数）をポップしてメソッドを呼び出します。
3. **`JUMP, 0xFFFFFFFC`** -- Haltセンチネル。`_start` イベントハンドラが完了したことをVMに伝えます。

## 完全な例: トグルドア

変数、制御フロー、算術演算、Updateイベントを示すより大きな例を紹介します:

```rust
pub let speed: float = 90.0
let is_open: bool = false
let target_angle: float = 0.0
let current_angle: float = 0.0

on Interact {
    is_open = !is_open
    if is_open {
        target_angle = 90.0
    } else {
        target_angle = 0.0
    }
}

on Update {
    if current_angle != target_angle {
        let step: float = speed * Time.deltaTime
        current_angle = current_angle + step
    }
}
```

データセクションは、プログラムが使用するすべての変数と定数を宣言します:

```
.data_start

    .export speed

    speed: %SystemSingle, 90
    is_open: %SystemBoolean, null
    target_angle: %SystemSingle, 0
    current_angle: %SystemSingle, 0
    __this_VRCUdonCommonInterfacesIUdonEventReceiver_0: %VRCUdonCommonInterfacesIUdonEventReceiver, this
    __this_UnityEngineGameObject_0: %UnityEngineGameObject, this
    __this_UnityEngineTransform_0: %UnityEngineTransform, this
    __const_0_SystemBoolean: %SystemBoolean, null
    __const_1_SystemSingle: %SystemSingle, 90
    __const_2_SystemSingle: %SystemSingle, 0
    __tmp_0_SystemBoolean: %SystemBoolean, null
    __tmp_1_SystemBoolean: %SystemBoolean, null
    __tmp_2_SystemSingle: %SystemSingle, null
    __tmp_3_SystemSingle: %SystemSingle, null
    __tmp_4_SystemSingle: %SystemSingle, null
    step: %SystemSingle, null

.data_end
```

`is_open` の初期値は `false` ではなく `null` であることに注意してください -- Udonのデータセクションはブール値 `true` を表現できないため、すべてのブール値は `null`（VMは `false` として扱う）で初期化されます。ブール値のデフォルトが `true` の場合、コンパイラは `_start` の先頭にランタイム初期化コードを挿入します。

コードセクションには2つのイベントハンドラが含まれます:

```
.code_start

    .export _interact
    .export _update

    _interact:
        # is_open = !is_open
        PUSH, is_open
        PUSH, __tmp_0_SystemBoolean
        EXTERN, "SystemBoolean.__op_UnaryNegation__SystemBoolean__SystemBoolean"
        PUSH, __tmp_0_SystemBoolean
        PUSH, is_open
        COPY

        # if is_open
        PUSH, is_open
        JUMP_IF_FALSE, 0x________    // jump to else label

        # target_angle = 90.0
        PUSH, __const_1_SystemSingle
        PUSH, target_angle
        COPY
        JUMP, 0x________             // jump past else

    __else_0:
        # target_angle = 0.0
        PUSH, __const_2_SystemSingle
        PUSH, target_angle
        COPY

    __endif_1:
        JUMP, 0xFFFFFFFC             // halt

    _update:
        # if current_angle != target_angle
        PUSH, current_angle
        PUSH, target_angle
        PUSH, __tmp_1_SystemBoolean
        EXTERN, "SystemSingle.__op_Inequality__SystemSingle_SystemSingle__SystemBoolean"
        PUSH, __tmp_1_SystemBoolean
        JUMP_IF_FALSE, 0x________    // jump to endif

        # let step = speed * Time.deltaTime
        PUSH, __tmp_2_SystemSingle
        EXTERN, "UnityEngineTime.__get_deltaTime__SystemSingle"
        PUSH, speed
        PUSH, __tmp_2_SystemSingle
        PUSH, __tmp_3_SystemSingle
        EXTERN, "SystemSingle.__op_Multiply__SystemSingle_SystemSingle__SystemSingle"
        PUSH, __tmp_3_SystemSingle
        PUSH, step
        COPY

        # current_angle = current_angle + step
        PUSH, current_angle
        PUSH, step
        PUSH, __tmp_4_SystemSingle
        EXTERN, "SystemSingle.__op_Addition__SystemSingle_SystemSingle__SystemSingle"
        PUSH, __tmp_4_SystemSingle
        PUSH, current_angle
        COPY

    __endif_2:
        JUMP, 0xFFFFFFFC             // halt

.code_end
```

`0x________` として表示されているアドレスは、可読性のためのプレースホルダです。実際の出力では、コンパイラはエミットパスですべてのラベルを具体的なバイトオフセットに解決します。

## アセンブリ出力の読み方

コンパイル出力を読み解くためのヒント:

- **PUSHを追う。** `EXTERN` や `COPY` の前に、先行する `PUSH` 命令がどのヒープスロットから読み取り、どこに書き込むかを正確に示します。`EXTERN` の前の最後の `PUSH` は通常、結果スロットです。
- **externをNoriコードに対応させる。** externシグネチャは型、メソッド名、パラメータ型、戻り値型を示します。`SystemSingle.__op_Addition__SystemSingle_SystemSingle__SystemSingle` は `float + float = float` です。
- **ジャンプで制御フローを追跡する。** `JUMP_IF_FALSE` は `if` 分岐（またはループの終了条件）です。後方への無条件 `JUMP` はループの末尾です。`JUMP, 0xFFFFFFFC` はイベントハンドラの終了を意味します。
- **COPYパターンを見つける。** `PUSH source / PUSH dest / COPY` シーケンスは変数代入です。出力では `let x = expr` や `x = expr` がこのように表現されます。
- **一時変数は一過性。** `__tmp_3_SystemSingle` のようなスロットは、VMにレジスタがないために存在します。一度書き込まれ、一度読み取られます。一時変数の値を頭の中でインライン展開できます。
