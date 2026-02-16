---
title: 言語の概要
description: VRChatワールド向けプログラミング言語Noriの概要。
sidebar:
  order: 1
---

Noriは、VRChatワールドを構築するためのプログラミング言語です。VRChat上のUdon仮想マシンで実行される命令セットであるUdon Assemblyにコンパイルされます。ビジュアルノードグラフを配線する代わりに、テキストベースのコードを記述し、Noriコンパイラがノードグラフと同じ出力に変換します。

## 設計思想

Noriは4つの原則に従います：

- **驚きがない。** 言語は見た目通りに動作します。隠れた型変換、暗黙の副作用、コンテキストによって変わる動作はありません。
- **エラーはドキュメントである。** すべてのエラーメッセージは、何が問題か、なぜ起きたか、どう対処すべきかを説明します。エラーコードは詳細なリファレンスページにリンクしています。
- **明示的であること。** 型注釈は必須です。同期モードは変数で宣言します。ネットワークターゲットはsend文に明記します。コードが実行時に何をするか常に把握できます。
- **馴染みやすく、正直であること。** 構文はRust、Go、TypeScriptを参考にしていますが、Udonがサポートできない機能があるかのように振る舞うことはありません。Udonにコールスタックがなければ、Noriもそれを偽装しません。

## ファイル構造

`.nori`ファイルは1つのUdonBehaviourです。`class`キーワードはなく、ファイル自体がクラスです。ファイルのトップレベルで宣言されたものはすべて、そのビヘイビアの状態とロジックの一部になります。

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

ファイルには4種類のトップレベル宣言を任意の順序で記述できます：

1. **変数**（`let`、`pub let`、`sync`）-- ビヘイビアのフィールド
2. **イベント**（`on EventName`）-- VRChatのライフサイクルおよびインタラクションイベントのハンドラ
3. **カスタムイベント**（`event Name`）-- ネットワーク経由で送信できるユーザー定義イベント
4. **関数**（`fn name()`）-- 再利用可能なロジックブロック

## 構文クイックツアー

以下は、ネットワーク対応のトグルドアを実装する完全なNoriプログラムです：

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

この例では、型注釈付きの変数、sync宣言、組み込みショートカット（`localPlayer`、`gameObject`）、静的メソッド呼び出し（`Networking.IsOwner`）、イベントハンドラ、制御フロー、式を示しています。

## NoriからUdonへのマッピング

Noriコンパイラのパイプラインは5つのステージで構成されます：

1. **字句解析器（Lexer）** -- ソーステキストをトークンの列に分解します。
2. **構文解析器（Parser）** -- トークン列から抽象構文木（AST）を構築します。
3. **意味解析器（Semantic Analyzer）** -- 型の解決、名前の検証、エラーチェックを行い、ASTにUdonの型情報を付与します。
4. **IR変換（IR Lowering）** -- 注釈付きASTをUdon命令のフラットな中間表現に変換します。
5. **Udon出力器（Udon Emitter）** -- IRをVRChatが読み込めるUdon Assemblyテキストにシリアライズします。

Noriの変数はすべてUdonメモリのヒープスロットになります。関数呼び出しはすべて、ヒープ変数に格納されたリターンアドレスを持つ`JUMP`になります。演算子はすべて、ホワイトリストに登録された.NETメソッドへの`EXTERN`呼び出しになります。NoriとUdonの間に抽象化レイヤーはなく、言語はUdonが実際に行うことの直接的で読みやすい表記法です。

## 言語リファレンス

- [変数](/ja/language/variables/) -- `let`、`pub let`、`sync`、型注釈
- [型](/ja/language/types/) -- プリミティブ型、配列、Unity型、VRChat型
- [式](/ja/language/expressions/) -- 演算子、メンバアクセス、文字列補間、配列リテラル
- [制御フロー](/ja/language/control-flow/) -- `if`/`else`、`while`、`for..in`、`break`、`continue`、`return`
- [関数](/ja/language/functions/) -- `fn`宣言、パラメータ、戻り値
- [イベント](/ja/language/events/) -- 組み込みVRChatイベントハンドラ
- [カスタムイベント](/ja/language/custom-events/) -- ユーザー定義イベントとネットワーク送信
- [ネットワーキング](/ja/language/networking/) -- オーナーシップ、同期変数、シリアライゼーション
- [制限事項](/ja/language/limitations/) -- Noriにできないこととその理由
