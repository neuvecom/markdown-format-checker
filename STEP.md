# VS Code拡張機能作成手順 - Markdown Format Checker

VS Code拡張機能「Markdown Format Checker」の作成から配布までの完全な手順書

## 概要

Markdownの書式をチェックするVS Code拡張機能を作成しました。この拡張機能は見出し行の下に空行を入れずにテーブルを設置している場合に警告を表示し、設定でオン・オフが可能です。

## 機能

- **見出し後のテーブルチェック**: 見出し行の直後に空行なしでテーブルが配置されている場合に警告表示
- **リアルタイム診断**: Markdownファイルの編集中に自動でチェック実行
- **設定可能**: 機能のオン・オフが可能な設定項目

## 作成手順

### STEP 1: プロジェクトセットアップ

1. **Yeomanジェネレーターでプロジェクト作成**
   ```bash
   npx --package yo --package generator-code -- yo code . --skipOpen -t ts -n "Markdown Format Checker" --extensionDescription "Checks Markdown formatting and warns about tables placed immediately after headings without blank lines" --pkgManager npm --gitInit
   ```

2. **依存関係のインストール**
   ```bash
   npm install
   ```

### STEP 2: package.json設定

`package.json`に以下の設定を追加：

```json
{
  "name": "markdown-format-checker",
  "displayName": "Markdown Format Checker",
  "description": "Checks Markdown formatting and warns about tables placed immediately after headings without blank lines",
  "version": "0.0.1",
  "publisher": "your-publisher-name",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/markdown-format-checker.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/markdown-format-checker/issues"
  },
  "homepage": "https://github.com/your-username/markdown-format-checker#readme",
  "license": "MIT",
  "engines": {
    "vscode": "^1.101.0"
  },
  "categories": [
    "Linters"
  ],
  "activationEvents": [
    "onLanguage:markdown"
  ],
  "main": "./dist/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "markdown-format-checker.checkDocument",
        "title": "Check Markdown Format"
      }
    ],
    "configuration": {
      "title": "Markdown Format Checker",
      "properties": {
        "markdownFormatChecker.enableTableAfterHeadingCheck": {
          "type": "boolean",
          "default": true,
          "description": "見出し行の下に空行を入れずにテーブルを設置していたら警告を表示"
        },
        "markdownFormatChecker.maxNumberOfProblems": {
          "type": "number",
          "default": 100,
          "description": "報告する問題の最大数"
        }
      }
    }
  }
}
```

### STEP 3: メイン拡張機能コード (src/extension.ts)

```typescript
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// 設定インターフェース
interface MarkdownFormatSettings {
	enableTableAfterHeadingCheck: boolean;
	maxNumberOfProblems: number;
}

// 診断コレクション
let diagnosticCollection: vscode.DiagnosticCollection;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Markdown Format Checker extension is now active!');

	// 診断コレクションを作成
	diagnosticCollection = vscode.languages.createDiagnosticCollection('markdownFormatChecker');
	context.subscriptions.push(diagnosticCollection);

	// コマンドを登録
	const checkCommand = vscode.commands.registerCommand('markdown-format-checker.checkDocument', () => {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor && activeEditor.document.languageId === 'markdown') {
			validateMarkdownDocument(activeEditor.document);
			vscode.window.showInformationMessage('Markdownドキュメントをチェックしました。');
		} else {
			vscode.window.showWarningMessage('Markdownファイルを開いてからコマンドを実行してください。');
		}
	});
	context.subscriptions.push(checkCommand);

	// ドキュメントが開かれたときまたは変更されたときにバリデーションを実行
	vscode.workspace.onDidOpenTextDocument(document => {
		if (document.languageId === 'markdown') {
			validateMarkdownDocument(document);
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (event.document.languageId === 'markdown') {
			validateMarkdownDocument(event.document);
		}
	}, null, context.subscriptions);

	// 設定が変更されたときに再バリデーション
	vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('markdownFormatChecker')) {
			// 開いているすべてのMarkdownドキュメントを再バリデーション
			vscode.workspace.textDocuments.forEach(document => {
				if (document.languageId === 'markdown') {
					validateMarkdownDocument(document);
				}
			});
		}
	}, null, context.subscriptions);

	// 既に開いているMarkdownドキュメントをチェック
	vscode.workspace.textDocuments.forEach(document => {
		if (document.languageId === 'markdown') {
			validateMarkdownDocument(document);
		}
	});
}

// Markdownドキュメントをバリデーション
function validateMarkdownDocument(document: vscode.TextDocument): void {
	const settings = getConfiguration();
	if (!settings.enableTableAfterHeadingCheck) {
		// チェックが無効化されている場合は診断をクリア
		diagnosticCollection.set(document.uri, []);
		return;
	}

	const diagnostics: vscode.Diagnostic[] = [];
	const text = document.getText();
	const lines = text.split('\n');

	let problemCount = 0;

	for (let i = 0; i < lines.length - 1 && problemCount < settings.maxNumberOfProblems; i++) {
		const currentLine = lines[i].trim();
		const nextLine = lines[i + 1].trim();

		// 見出し行かどうかをチェック（#で始まる行）
		if (isHeadingLine(currentLine)) {
			// 次の行がテーブル行かどうかをチェック
			if (isTableLine(nextLine)) {
				problemCount++;
				
				// 診断情報を作成
				const range = new vscode.Range(
					new vscode.Position(i + 1, 0),
					new vscode.Position(i + 1, nextLine.length)
				);

				const diagnostic = new vscode.Diagnostic(
					range,
					'見出し行の直後にテーブルを配置する前に空行を挿入してください。',
					vscode.DiagnosticSeverity.Warning
				);

				diagnostic.source = 'Markdown Format Checker';
				diagnostic.code = 'table-after-heading';

				// 関連情報を追加
				diagnostic.relatedInformation = [
					new vscode.DiagnosticRelatedInformation(
						new vscode.Location(document.uri, new vscode.Range(i, 0, i, currentLine.length)),
						'この見出し行の直後にテーブルがあります'
					)
				];

				diagnostics.push(diagnostic);
			}
		}
	}

	// 診断情報を設定
	diagnosticCollection.set(document.uri, diagnostics);
}

// 見出し行かどうかを判定
function isHeadingLine(line: string): boolean {
	// #で始まる行（ATX見出し）
	return /^#{1,6}\s+.+/.test(line);
}

// テーブル行かどうかを判定
function isTableLine(line: string): boolean {
	// |を含む行をテーブル行として判定
	// より厳密には、Markdownテーブルの形式をチェックすることもできますが、
	// 簡単のため|を含む行をテーブル行とします
	return line.includes('|') && line.trim().length > 0;
}

// 設定を取得
function getConfiguration(): MarkdownFormatSettings {
	const config = vscode.workspace.getConfiguration('markdownFormatChecker');
	return {
		enableTableAfterHeadingCheck: config.get('enableTableAfterHeadingCheck', true),
		maxNumberOfProblems: config.get('maxNumberOfProblems', 100)
	};
}

// This method is called when your extension is deactivated
export function deactivate() {
	if (diagnosticCollection) {
		diagnosticCollection.dispose();
	}
}
```

### STEP 4: プロジェクト設定ファイル

1. **LICENSEファイル作成**
   ```
   MIT License
   
   Copyright (c) 2025 Markdown Format Checker
   
   Permission is hereby granted, free of charge, to any person obtaining a copy
   of this software and associated documentation files (the "Software"), to deal
   in the Software without restriction, including without limitation the rights
   to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
   copies of the Software, and to permit persons to whom the Software is
   furnished to do so, subject to the following conditions:
   
   The above copyright notice and this permission notice shall be included in all
   copies or substantial portions of the Software.
   
   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
   IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
   FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
   AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
   LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
   OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
   SOFTWARE.
   ```

2. **Copilot指示ファイル (.github/copilot-instructions.md)**
   ```markdown
   <!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->
   
   This is a VS Code extension project. Please use the get_vscode_api with a query as input to fetch the latest VS Code API references.
   
   ## Project Overview
   This extension provides Markdown formatting validation, specifically checking for tables placed immediately after heading lines without blank lines.
   
   ## Key Features
   - Markdown syntax validation
   - Detection of tables placed directly after headings without blank lines
   - Configurable settings for enabling/disabling checks
   - Real-time diagnostics while editing
   
   ## Technical Stack
   - TypeScript
   - VS Code Extension API
   - Webpack bundling
   - ESLint for code quality
   ```

### STEP 5: テストファイル作成

`test-markdown.md`を作成してテスト用のMarkdownコンテンツを追加：

```markdown
# 見出し1
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| データ1 | データ2 | データ3 |

## 見出し2

| 列1 | 列2 |
|-----|-----|
| 正常 | 正常 |

### 見出し3
| 問題のある | テーブル |
|-----------|---------|
| 空行なし | エラー |

#### 正常な見出し

これは通常のテキストです。

##### 見出し5
| また | 問題 |
|-----|-----|
| 空行 | なし |
```

### STEP 6: ビルドとテスト

1. **コンパイル**
   ```bash
   npm run compile
   ```

2. **テスト実行**
   ```bash
   npm test
   ```

3. **開発モードでテスト**
   - F5キーを押してExtension Development Hostを起動
   - 新しいウィンドウで`test-markdown.md`を開いて動作確認

### STEP 7: パッケージ化

1. **VSCEツールインストール**
   ```bash
   npm install -g @vscode/vsce
   ```

2. **VSIXパッケージ作成**
   ```bash
   vsce package
   ```

   これで`markdown-format-checker-0.0.1.vsix`ファイルが作成されます。

### STEP 8: インストール方法

#### 方法1: 開発モードでテスト（推奨）
- F5キーを押すと新しいVS Codeウィンドウで拡張機能がテストできます

#### 方法2: VSIXファイルからインストール
1. VS Codeで`Ctrl+Shift+P`（またはCmd+Shift+P）
2. 「Extensions: Install from VSIX...」を選択
3. 作成された`markdown-format-checker-0.0.1.vsix`ファイルを選択
4. インストール完了後、VS Codeを再起動

#### 方法3: コマンドラインからインストール
```bash
code --install-extension markdown-format-checker-0.0.1.vsix
```

## 使用方法

1. Markdownファイルを開く
2. 見出し行の直後に空行なしでテーブルがあると自動的に警告が表示される
3. Problems パネルで問題を確認可能
4. コマンドパレットから「Check Markdown Format」で手動チェック可能

## 設定項目

- `markdownFormatChecker.enableTableAfterHeadingCheck`: テーブルチェック機能の有効/無効（デフォルト: true）
- `markdownFormatChecker.maxNumberOfProblems`: 報告する問題の最大数（デフォルト: 100）

## プロジェクト構造

```
markdown-format-checker/
├── .github/
│   └── copilot-instructions.md
├── .vscode/
│   ├── extensions.json
│   ├── launch.json
│   ├── settings.json
│   └── tasks.json
├── src/
│   ├── extension.ts
│   └── test/
│       └── extension.test.ts
├── dist/
│   └── extension.js
├── CHANGELOG.md
├── LICENSE
├── README.md
├── package.json
├── test-markdown.md
├── tsconfig.json
└── webpack.config.js
```

## 注意事項

- publisherやrepository URLは実際の値に変更してください
- VS Code Marketplaceに公開する場合は、適切なpublisher名が必要です
- 実際の使用前に十分なテストを行ってください

## 完了

VS Code拡張機能「Markdown Format Checker」の開発が完了しました。この拡張機能により、Markdownファイルの書式チェックが自動化され、より良いドキュメント作成が可能になります。
