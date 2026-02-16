---
title: Udon VM
description: VRChatのUdon仮想マシンの仕組み -- オペコード、ヒープメモリ、externディスパッチ。
sidebar:
  order: 1
---

Udonは、すべてのVRChatワールド内で動作する仮想マシンです。Unity上に構築されたスタック・ヒープ型インタープリタで、ユーザーコードがファイルシステム、ネットワーク、その他VRChatが明示的にホワイトリストに登録していないリソースにアクセスできないようにサンドボックス化されています。すべてのNoriプログラムはUdon Assemblyにコンパイルされ、VMが実行時にそれを実行します。

Udonには組み込みの算術演算、文字列操作、Unity APIを直接呼び出す方法がありません。すべての有用な計算は単一のオペコード `EXTERN` を通じて行われ、ホワイトリストに登録された.NETメソッドにディスパッチされます。命令セットの残りは、データの移動と実行フローの制御のために存在します。

## メモリモデル

Udonのメモリは、**ヒープ**と**整数スタック**の2つの構造に分かれています。

### ヒープ

ヒープは型付き値のフラットな配列です。Noriプログラム内のすべての変数 -- ユーザーが宣言した変数、コンパイラが生成した一時変数、定数のいずれも -- この配列の1スロットを占有します。各スロットには名前、型、初期値があります。

```
// Heap layout (conceptual)
index 0: speed        %SystemSingle   90.0
index 1: is_open      %SystemBoolean  null
index 2: __tmp_0      %SystemSingle   null
index 3: __const_0    %SystemString   "Hello"
```

ローカル変数、レジスタ、スタックフレームは存在しません。関数本体内で宣言された変数は、ファイルのトップレベルで宣言された変数と同じフラットなヒープに配置されます。ヒープはデータが存在できる唯一の場所です。

### 整数スタック

整数スタックは値ではなく**ヒープアドレス**を保持します。命令がヒープスロットを読み書きする必要がある場合、まずそのスロットのアドレスがスタックにプッシュされます。命令はそのアドレスをポップし、ヒープ内の実際の値を参照します。

つまり、あらゆる操作の典型的なパターンは以下の通りです:

1. 入力Aのヒープアドレスを `PUSH`
2. 入力Bのヒープアドレスを `PUSH`
3. 出力スロットのヒープアドレスを `PUSH`
4. `EXTERN` でAとBから読み取り、結果を出力スロットに書き込むメソッドを呼び出す

たとえば、2つの整数の加算:

```
PUSH, a            // push address of heap slot 'a'
PUSH, b            // push address of heap slot 'b'
PUSH, __tmp_0      // push address of result slot
EXTERN, "SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32"
```

実行後、ヒープ内の `__tmp_0` の値に `a` と `b` の合計が格納されます。

## オペコード一覧

Udonは9つのオペコードを定義しています。オペコード3は未使用です。

| オペコード | 名前             | サイズ   | 説明                                                                                              |
|--------|------------------|--------|----------------------------------------------------------------------------------------------------------|
| 0      | `NOP`            | 4バイト  | 何もしない。プログラムカウンタを4バイト進めます。                                                 |
| 1      | `PUSH`           | 8バイト  | uint32のヒープアドレスを整数スタックにプッシュします。4バイトのオペランドがヒープアドレスです。             |
| 2      | `POP`            | 4バイト  | 整数スタックのトップの値をポップして破棄します。                                                  |
| 4      | `JUMP_IF_FALSE`  | 8バイト  | スタックからヒープアドレスをポップし、そのアドレスのブール値を読み取ります。falseの場合、4バイトのターゲットアドレスにジャンプします。それ以外は次の命令に進みます。 |
| 5      | `JUMP`           | 8バイト  | 4バイトのターゲットアドレスへの無条件ジャンプ。特殊アドレス `0xFFFFFFFC` はhaltセンチネルで、現在のイベントハンドラの終了をVMに伝えます。 |
| 6      | `EXTERN`         | 8バイト  | ホワイトリストに登録された.NETメソッドを呼び出します。4バイトのオペランドはメソッドシグネチャ文字列への参照です。引数と戻り値は、事前にスタックにプッシュされたヒープアドレスを介して渡されます。 |
| 7      | `ANNOTATION`     | 8バイト  | デバッグメタデータ用のロングNOP。VMはこれを完全に無視します。                                  |
| 8      | `JUMP_INDIRECT`  | 8バイト  | 4バイトのオペランドで指定されたヒープインデックスに格納されたアドレスにジャンプします。関数からのリターンに使用されます。   |
| 9      | `COPY`           | 4バイト  | スタックから2つのヒープアドレスをポップし、最初のアドレスの値を2番目のアドレスにコピーします。      |

:::note
Noriコンパイラのエミッタは `COPY` を20バイトとしてカウントします。これは `PUSH + PUSH + COPY` シーケンス全体を単一のIR命令として出力するためです。同様に、`JUMP_IF_FALSE` は16バイト（`PUSH + JUMP_IF_FALSE`）、`JUMP_INDIRECT` は16バイト（`PUSH + JUMP_INDIRECT`）としてカウントされます。これらは生のオペコードサイズではなく、IRレベルのサイズです。
:::

## Externシステム

`EXTERN` オペコードは、Udonがすべてを実行する方法です: 算術演算、文字列操作、Unity API呼び出し、VRChat SDK呼び出し。各externは、シグネチャ文字列で識別されるホワイトリスト登録済みの.NETメソッドです。

### シグネチャ形式

```
TypeName.__MethodName__ParamType1_ParamType2__ReturnType
```

形式は4つの部分で構成されます:

1. **TypeName** -- メソッドを所有する.NET型で、ドットを除去したもの。`System.Int32` は `SystemInt32` に、`UnityEngine.GameObject` は `UnityEngineGameObject` になります。
2. **MethodName** -- メソッド名で、ダブルアンダースコアが接頭辞として付きます。プロパティは `__get_PropertyName` または `__set_PropertyName` になります。演算子は `__op_Addition`、`__op_Equality` などになります。
3. **パラメータ型** -- パラメータ型はシングルアンダースコアで区切られ、両側がダブルアンダースコアで囲まれます。配列型には `Array` サフィックスが付きます: `System.Int32[]` は `SystemInt32Array` になります。
4. **戻り値型** -- 最後のダブルアンダースコアの後の戻り値型。voidメソッドは `SystemVoid` を使用します。

### 例

| Noriコード             | Externシグネチャ                                                                  |
|-----------------------|-----------------------------------------------------------------------------------|
| `a + b` (int)         | `SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32`                  |
| `a == b` (string)     | `SystemString.__op_Equality__SystemString_SystemString__SystemBoolean`            |
| `log("hi")`          | `UnityEngineDebug.__Log__SystemObject__SystemVoid`                                |
| `transform.position`  | `UnityEngineTransform.__get_position__UnityEngineVector3`                         |
| `obj.SetActive(true)` | `UnityEngineGameObject.__SetActive__SystemBoolean__SystemVoid`                    |

### インスタンスメソッド

インスタンスメソッドの場合、メソッドを所有するオブジェクト（`this` 参照）は引数の**前に**スタックにプッシュされます。externシグネチャのパラメータリストには `this` の型は含まれません -- 暗黙的です。

```
// Nori: gameObject.SetActive(true)
PUSH, __this_UnityEngineGameObject_0    // push 'this' (the GameObject)
PUSH, __const_true                       // push the boolean argument
EXTERN, "UnityEngineGameObject.__SetActive__SystemBoolean__SystemVoid"
```

### 静的メソッド

静的メソッドには `this` 参照がありません。引数と戻り値スロットのみがプッシュされます。

```
// Nori: Networking.IsOwner(localPlayer, gameObject)
PUSH, __tmp_localPlayer                  // first argument
PUSH, __this_UnityEngineGameObject_0     // second argument
PUSH, __tmp_result                       // result slot
EXTERN, "VRCSDKBaseVRCNetworking.__IsOwner__VRCSDKBaseVRCPlayerApi_UnityEngineGameObject__SystemBoolean"
```

## 実行モデル

Udonプログラムには `main()` 関数や初期化エントリポイントがありません。代わりに、VRChatランタイムが**イベント**を通じてプログラムを呼び出します。

イベントはコードセクション内のエクスポートされたラベルです。プレイヤーがオブジェクトをクリックすると、VRChatは `_interact` ラベルにジャンプします。ワールドがロードされると `_start` に、新しいフレームが始まると `_update` にジャンプします。各イベントハンドラは `JUMP, 0xFFFFFFFC` 命令 -- haltセンチネル -- に到達するまで実行され、ハンドラが終了し制御がVRChatに戻るべきことをVMに伝えます。

イベント間では、プログラムは何もしません。バックグラウンドスレッド、メインループ、イベントハンドラ外でコードを実行する方法はありません。VRChatランタイムが実行ライフサイクルを完全に所有しています。

```
// A complete Udon program with two event handlers
.code_start

    .export _start
    .export _interact

    _start:
        PUSH, __const_str_0
        EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"
        JUMP, 0xFFFFFFFC       // halt — _start is done

    _interact:
        PUSH, __const_str_1
        EXTERN, "UnityEngineDebug.__Log__SystemObject__SystemVoid"
        JUMP, 0xFFFFFFFC       // halt — _interact is done

.code_end
```

VMはワールドのロード時に `_start` にジャンプし、プレイヤーがオブジェクトをクリックした時に `_interact` にジャンプします。各ハンドラはhaltセンチネルで終了し、制御をVRChatに返します。
