# Markdown Format Checker

VS Code拡張機能として動作するMarkdown書式チェッカーです。

## 機能

- **見出し後のテーブルチェック**: 見出し行の下に空行を入れずにテーブルを設置している場合に警告を表示
- **リアルタイム診断**: ファイルの編集中に自動的にチェックを実行
- **設定可能**: チェック機能のオン・オフが可能

## 使用方法

1. Markdownファイルを開く
2. 拡張機能が自動的にドキュメントをチェック
3. 問題がある場合、該当行に警告が表示される
4. コマンドパレット（Ctrl+Shift+P）から「Check Markdown Format」を実行して手動チェックも可能

## インストール方法

### 方法1: VSIXファイルからインストール
```bash
code --install-extension markdown-format-checker-0.0.1.vsix
```

### 方法2: 開発モードでテスト
1. このリポジトリをクローン
2. `npm install`を実行
3. VS Codeで開き、F5キーを押してデバッグモードで実行

## 設定

以下の設定項目を利用できます：

- `markdownFormatChecker.enableTableAfterHeadingCheck`: 見出し後のテーブルチェックを有効にする（デフォルト: true）
- `markdownFormatChecker.maxNumberOfProblems`: 報告する問題の最大数（デフォルト: 100）

## 例

### 問題のある例
```markdown
# 見出し
| 列1 | 列2 |
|-----|-----|
| データ | データ |
```

### 正しい例
```markdown
# 見出し

| 列1 | 列2 |
|-----|-----|
| データ | データ |
```

## 開発

1. このリポジトリをクローン
2. `npm install`を実行
3. VS Codeで開き、F5キーを押してデバッグモードで実行

## 要件

- VS Code 1.101.0以上

## リリースノート

### 0.0.1

初回リリース

## 公式ページ

[https://neuvecom.github.io/markdown-format-checker/](https://neuvecom.github.io/markdown-format-checker/)

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
