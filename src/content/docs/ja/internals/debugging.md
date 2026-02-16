---
title: デバッグ
description: コンパイラエラーの読み方、アセンブリ出力の理解、Noriプログラムのデバッグ。
sidebar:
  order: 4
---

Noriプログラムで問題が発生した場合、必要な情報は2つのソースから得られます: コンパイラエラー（コードの実行前に検出される）とランタイムの動作（プレイモード中にUnityコンソールで確認できる）。このページでは、両方の読み方を説明します。

## エラーメッセージの読み方

すべてのNoriエラーは同じ構造に従います:

```
error[E0042]: Generic types are not supported
  --> scripts/inventory.nori:15:5
   |
15 |     let items: List<Item> = []
   |                ^^^^^^^^^^
   |
   Udon does not support generic collection types like List<T>.
   .NET generics (List<T>, Dictionary<K,V>, etc.) are not part of the extern whitelist.
   This is a fundamental limitation of the Udon VM, not a Nori limitation.

   help: Use a typed array instead: int[], string[], GameObject[]
```

メッセージの各部分:

1. **重大度とコード** -- `error[E0042]`。コードはエラーの種類を一意に識別し、専用のドキュメントページにリンクします。
2. **タイトル** -- `Generic types are not supported`。何が問題かの簡潔な説明。
3. **ソース位置** -- `scripts/inventory.nori:15:5`。ファイル、行番号、列番号。
4. **ソーススニペット** -- 問題のある範囲に `^` 文字で下線が引かれた実際のコード行。
5. **説明** -- なぜこれが起きたか、何を意味するかのより詳細な説明。
6. **提案** -- `help:` 接頭辞付きで、問題を修正するための具体的な推奨事項。

## エラーカテゴリ

エラーコードは、どのコンパイラステージで生成されたかに応じて範囲ごとにグループ化されています:

| コード範囲    | ステージ           | 説明                                                   |
|---------------|-----------------|---------------------------------------------------------------|
| E0001 -- E0009 | 字句解析器          | 文字レベルの問題: 閉じられていない文字列、不正な文字、閉じられていないブロックコメント。 |
| E0010 -- E0039 | 構文解析器         | 構文エラー: 予期しないトークン、不足しているキーワード、不正な宣言、不正な送信先。 |
| E0040 -- E0069 | 型システム    | 型の不一致、ジェネリクスなどの非対応型。             |
| E0070 -- E0099 | スコープ          | 未定義の変数や関数。                             |
| E0100 -- E0129 | 制約    | 再帰などの言語レベルの制限。                   |
| E0130 -- E0159 | Extern        | メソッドが見つからない、曖昧なオーバーロード、読み取り専用プロパティ、不正なenum値。 |
| W0001 -- W0099 | 警告       | 認識されないイベント名など、致命的でない問題。               |

エラー（E接頭辞）はコンパイルを中断します。警告（W接頭辞）は出力を生成しますが、潜在的な問題をフラグします。

## よくあるエラーと修正方法

### E0070: 未定義の変数

```
error[E0070]: Undefined variable
  --> door.nori:8:5
   |
 8 |     is_opn = !is_opn
   |     ^^^^^^
   |
   This variable name was not found in the current scope. Variables must be declared
   with 'let' before they can be used.

   help: Check for typos in the variable name, or add a declaration.
```

**原因:** 変数名がどの宣言とも一致しません。ほとんどの場合タイプミスです。

**修正方法:** 変数宣言とスペルを照合してください。この場合、`is_opn` は `is_open` であるべきです。

### E0130: メソッドが見つからない

```
error[E0130]: Method not found
  --> player.nori:12:5
   |
12 |     gameObject.setActive(false)
   |                ^^^^^^^^^
   |
   The method was not found on the given type, or no overload matches the provided arguments.

   help: Check the method name and argument types.
```

**原因:** メソッド名または引数の型が、ホワイトリストに登録されたUdon externと一致しません。Udonのメソッド名は大文字小文字を区別し、.NETの命名規則と正確に一致する必要があります。

**修正方法:** 正しい大文字小文字を使用してください。Unity APIメソッドはPascalCaseです: `setActive` ではなく `SetActive`。各型で利用可能な正確なメソッドシグネチャについては、[APIリファレンス](/api/)を確認してください。

### E0040: 型の不一致

```
error[E0040]: Type mismatch
  --> timer.nori:6:21
   |
 6 |     let total: int = elapsed * rate
   |                      ^^^^^^^^^^^^^^
   |
   The types in this expression are not compatible.

   help: Check that both sides of the operation have compatible types.
```

**原因:** オペランドの型を一緒に使用できません。Noriは限定的な暗黙の型変換（intからfloat、intからdouble、floatからdouble）をサポートしますが、他の組み合わせは明示的な処理が必要です。

**修正方法:** 両方のオペランドが同じ型であることを確認するか、両方が変換可能な型を使用してください。`elapsed` が `float` で `rate` が `int` の場合、`rate` を `float` として宣言すると問題が解決します。

### E0042: ジェネリック型は非対応

```
error[E0042]: Generic types are not supported
  --> inventory.nori:3:16
   |
 3 |     let items: List<string> = []
   |                ^^^^^^^^^^^^
   |
   Udon's type system is based on concrete .NET types exposed through the extern system.
   .NET generics (List<T>, Dictionary<K,V>, etc.) are not part of the extern whitelist.
   This is a fundamental limitation of the Udon VM, not a Nori limitation.

   help: Use a typed array instead: int[], string[], GameObject[]
```

**原因:** Udonはジェネリックな.NET型をホワイトリストに登録していません。これはVMレベルの制限であり、回避策はありません。

**修正方法:** ジェネリックコレクションの代わりに型付き配列を使用してください:

```rust
// Instead of List<string>:
let items: string[] = []

// Instead of Dictionary<string, int>:
// Use parallel arrays or a different data structure
let keys: string[] = []
let values: int[] = []
```

### E0100: 再帰が検出された

```
error[E0100]: Recursion detected
  --> math.nori:1:1
   |
 1 | fn factorial(n: int): int {
   | ^^^^^^^^^^^^^^^^^^^^^^^^^^
   |
   Udon has no call stack, so recursive function calls are not possible.
   The compiler detected a cycle in the call graph.

   help: Rewrite using iterative loops (while, for) instead of recursive calls.
```

**原因:** Nori関数はリターンアドレスを単一のヒープ変数に格納します。再帰呼び出しはこのアドレスを上書きし、正しい場所に戻ることが不可能になります。コンパイラはこれをコンパイル時に検出してプログラムを拒否します。

**修正方法:** 再帰ロジックを反復ループに変換してください:

```rust
// Instead of recursive factorial:
fn factorial(n: int): int {
    let result: int = 1
    let i: int = 1
    while i <= n {
        result = result * i
        i = i + 1
    }
    return result
}
```

## アセンブリ出力の読み方

ソースレベルでは正しいように見えるが実行時に予期しない結果を生む動作をデバッグする場合、生成されたUdon Assemblyを検査すると役立ちます。コンパイラは、コンパイルされた各 `.nori` ファイルと一緒に `.uasm` ファイルを生成します。

### 変数名の理解

データセクション内:

- **ユーザー宣言変数**は元の名前を保持します: `speed`、`score`、`is_open`。
- **コンパイラ一時変数**は `__tmp_N_Type` と命名されます: `__tmp_0_SystemInt32`、`__tmp_3_SystemBoolean`。式の中間結果を保持します。
- **定数**は `__const_N_Type` と命名されます: `__const_0_SystemString`、`__const_1_SystemInt32`。重複排除されます -- 同じリテラル値が複数回使用されても、ヒープスロットは1つだけ共有されます。
- **関数の配管**は `__retaddr_funcName`、`__param_funcName_paramName`、`__retval_funcName` を使用します。
- **This参照**は `__this_UnityEngineGameObject_0`、`__this_UnityEngineTransform_0`、`__this_VRCUdonCommonInterfacesIUdonEventReceiver_0` です。

### 実行の追跡

実行時に何が起こるかを追うには:

1. 関心のあるイベントラベル（例: `_interact:`）を見つけます。
2. 命令を上から下へ読みます。
3. 各 `PUSH` について、ヒープ変数名をメモします。`EXTERN` の前では、プッシュされたアドレスが入力と出力です（最後のプッシュ = 出力）。`COPY` の前では、最初のプッシュがソース、2番目がデスティネーションです。
4. `JUMP_IF_FALSE` に到達したら、条件は先行する命令で評価されています。ターゲットアドレスは、条件がfalseの場合に実行がどこに行くかを示します。
5. 後方への無条件 `JUMP` はループの末尾にいることを意味します。前方への `JUMP` はelse分岐をスキップするか、ブロックを抜けることを意味します。
6. `JUMP, 0xFFFFFFFC` はイベントハンドラの終了を意味します。

### Externのソースコードへの対応

externシグネチャには、元のNori操作を特定するために必要なすべてが含まれています:

| Externシグネチャ | Noriの等価コード |
|---|---|
| `SystemInt32.__op_Addition__SystemInt32_SystemInt32__SystemInt32` | `intA + intB` |
| `SystemSingle.__op_Multiply__SystemSingle_SystemSingle__SystemSingle` | `floatA * floatB` |
| `SystemBoolean.__op_UnaryNegation__SystemBoolean__SystemBoolean` | `!boolVal` |
| `UnityEngineTransform.__get_position__UnityEngineVector3` | `transform.position`（getter） |
| `UnityEngineTransform.__set_position__UnityEngineVector3__SystemVoid` | `transform.position = v`（setter） |
| `UnityEngineDebug.__Log__SystemObject__SystemVoid` | `log(...)` |
| `SystemString.__Concat__SystemString_SystemString__SystemString` | 文字列連結（補間から） |

## ランタイムデバッグ

プログラムのコンパイルが成功した後、ランタイムの問題はUnityコンソールで診断します。

### コンソール出力

Noriは3つのログ関数を提供し、それぞれUnityコンソールのメッセージレベルに対応します:

```rust
log("Normal message")     // white text in Console
warn("Something odd")     // yellow warning
error("Something broke")  // red error
```

文字列補間を使って変数の値を検査できます:

```rust
log("position = {transform.position}")
log("score = {score}, is_open = {is_open}")
log("delta = {Time.deltaTime}")
```

### よくあるランタイムの問題

**Null参照。** `pub let` 変数がInspectorで割り当てられていない場合、実行時に `null` になります。null参照のプロパティへのアクセスやメソッドの呼び出しは、Unityコンソールにランタイムエラーを生成します。すべてのpublic変数が割り当てられていることを確認してください。

**オーナーシップエラー。** 同期変数はオブジェクトのオーナーのみが変更できます。オーナーでないプレイヤーが `sync` 変数を変更しようとすると、変更は暗黙的に無視されます。同期状態を変更する前に `Networking.IsOwner(localPlayer, gameObject)` でオーナーシップを確認するか、`Networking.SetOwner(localPlayer, gameObject)` で先にオーナーシップを取得してください。

**イベントの順序。** `Start` はワールドのロード時に1回発生しますが、異なるオブジェクトの `Start` イベントの実行順序は保証されません。あるオブジェクトの `Start` が実行される時に、別のオブジェクトの `Start` がすでに実行されていることを前提にしないでください。

**フレームレート依存の動作。** `on Update` 内のコードはフレームごとに1回実行されます。毎フレーム固定量だけオブジェクトを移動すると、速度はフレームレートによって変動します。フレームレートに依存しない動作にするために、常に移動量に `Time.deltaTime` を掛けてください:

```rust
on Update {
    // Wrong: moves faster at higher frame rates
    // position = position + 0.1

    // Correct: moves at constant speed regardless of frame rate
    let step: float = speed * Time.deltaTime
    position = position + step
}
```
