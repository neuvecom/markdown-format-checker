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
