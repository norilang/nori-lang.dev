---
title: はじめてのワールド
description: Noriで簡単なインタラクティブVRChatワールドを3ステップで構築します。
sidebar:
  order: 3
---

このチュートリアルでは、Noriを使って小さなインタラクティブVRChatワールドを構築する手順を説明します。各ステップで新しい言語機能を紹介し、前のステップの上に積み上げていきます。最終的に、クリック可能なオブジェクト、アニメーション付きドア、ネットワーク同期スコアボードが完成します。

## ステップ1：クリック可能なオブジェクト

最もシンプルなインタラクションから始めましょう：クリック回数をカウントするオブジェクトです。

1. **Project** ウィンドウで右クリックし、**Create > Nori Script** を選択します。ファイル名を `click_counter.nori` に変更します。
2. テキストエディタで開き、テンプレートを以下のコードに置き換えます：

```rust
let count: int = 0

on Interact {
    count = count + 1
    log("Clicked {count} times!")
}
```

3. シーンに **Cube** を作成します（GameObject > 3D Object > Cube）。
4. Projectウィンドウから `click_counter.nori` を **Hierarchy** 内のCubeにドラッグします。
5. Playモードに入り、Cubeをクリックします。Consoleに「Clicked 1 times!」「Clicked 2 times!」と順に表示されるはずです。

### このコードの解説

- `let count: int = 0` は `count` という名前の `int` 型変数を初期値 `0` で宣言します。Noriではすべての変数に明示的な型が必要です。
- `on Interact { ... }` はプレイヤーがオブジェクトをクリックしたときに実行されるイベントハンドラーを定義します。`Interact` はVRChatの組み込みイベントです。
- `log("Clicked {count} times!")` はコンソールにメッセージを出力します。`{count}` の構文は**文字列補間**で、`count` の現在の値が文字列に挿入されます。

## ステップ2：トグルドア

次に、クリックすると開閉するドアを作成します。ここではパブリック変数、ブーリアン、フレームごとの更新を紹介します。

1. 新しいNoriスクリプトを作成し（**Create > Nori Script**）、ファイル名を `toggle_door.nori` に変更します。
2. テキストエディタで開き、テンプレートを以下のコードに置き換えます：

```rust
pub let speed: float = 90.0
let is_open: bool = false
let current_angle: float = 0.0
let target_angle: float = 0.0

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

3. ドアとして使用する2つ目のGameObjectをシーンに追加します（例：スケール調整したCube）。
4. `toggle_door.nori` を **Hierarchy** 内のドアGameObjectにドラッグします。
5. Inspectorの Public Variables の下に **Speed** フィールドが表示され、編集できます。Playモードに入り、ドアをクリックしてトグルしてみましょう。

### このコードの解説

- `pub let speed: float = 90.0` は**パブリック**変数を宣言します。`pub` キーワードにより変数がUnity Inspectorに公開され、コードを編集せずに調整できます。ここではドアが1秒あたり何度回転するかを制御します。
- `let is_open: bool = false` はドアが現在開いているか閉じているかを追跡するブーリアンです。`!` 演算子で `true` と `false` を切り替えます。
- `on Update { ... }` は毎フレーム実行されます。アニメーションや継続的なロジックを記述する場所です。フレームレートはマシンによって異なるため、フレームごとに固定量で移動させるべきではありません。
- `Time.deltaTime` は前のフレームからの経過時間を秒単位で返します。速度に `Time.deltaTime` を掛けることで、フレームレートに関係なくドアが同じ速度で動くようになります。90 FPSでは `deltaTime` は小さく、30 FPSでは大きくなるため、いずれの場合も1秒あたりの移動量は同じになります。
- ネストされた `if` 文は角度をクランプし、ドアがオーバーシュートせず目標位置で正確に停止するようにします。

## ステップ3：ネットワーク同期スコアボード

最後に、ワールド内のすべてのプレイヤー間で同期するスコアボードを構築します。ここではネットワーキング、カスタムイベント、関数を紹介します。

1. 新しいNoriスクリプトを作成し（**Create > Nori Script**）、ファイル名を `scoreboard.nori` に変更します。
2. テキストエディタで開き、テンプレートを以下のコードに置き換えます：

```rust
pub let max_score: int = 10
sync none score: int = 0
let is_game_over: bool = false

on Start {
    log("Scoreboard ready!")
}

fn update_display() {
    log("Score: {score}")
}

event AddPoint {
    score = score + 1
    update_display()
    if score >= max_score {
        send GameOver to All
    }
}

event GameOver {
    is_game_over = true
    log("Game over! Final score: {score}")
}

on Interact {
    if is_game_over {
        log("Game is over!")
        return
    }
    send AddPoint to All
}
```

3. スコアボード用の新しいGameObjectを作成します。
4. `scoreboard.nori` を **Hierarchy** 内のスコアボードGameObjectにドラッグします。
5. Playモードに入ります。スコアボードをクリックするとスコアが加算されます。最大スコアに達すると、それ以降のクリックは無視されます。

### このコードの解説

- `sync none score: int = 0` は**同期変数**を宣言します。`sync` キーワードはVRChatにこの変数をネットワーク経由で複製するよう指示し、すべてのプレイヤーが同じ値を見られるようにします。`none` 同期モードは、補間なしでそのまま値を送信します。
- `fn update_display() { ... }` は**関数**を定義します。関数を使うと再利用可能なロジックを整理できます。他の関数と同じように名前で呼び出します：`update_display()`。
- `event AddPoint { ... }` は**カスタムイベント**を定義します。`Start` や `Interact` のような組み込みイベントとは異なり、カスタムイベントは自分で定義するものです。`send` を使ってコードからトリガーできます。
- `send AddPoint to All` は、ローカルプレイヤーだけでなく、ワールド内の**すべてのクライアント**で `AddPoint` イベントをトリガーします。これがネットワーク経由でアクションを連携させる方法です。`send ... to Owner` を使ってオブジェクトのオーナーのみをターゲットにすることもできます。
- `return` は現在のイベントハンドラーを早期に終了します。ここではゲーム終了後のインタラクションを防止しています。

## 学んだこと

この3つのステップで、Noriのコアとなる構成要素を学びました：

- `let` と型アノテーション（`int`、`float`、`bool`）による**変数**
- `pub let` による、Inspectorで編集可能な**パブリック変数**
- `Start`、`Interact`、`Update` などの**組み込みイベント**
- 文字列内の `{variable}` による**文字列補間**
- `if` / `else` による**条件分岐**
- `on Update` 内の `Time.deltaTime` を使った**フレームベースのアニメーション**
- `fn` による再利用可能なロジックの**関数**
- `sync`、カスタム `event` ブロック、`send ... to All` による**ネットワーキング**

## 次のステップ

- [サンプル集](/ja/getting-started/examples/) — テレポーターやタイマーなど、よくあるVRChatシナリオの注釈付きコードパターン。
- [言語リファレンス](/ja/language/variables/) — Noriの構文、型、機能の完全なドキュメント。
