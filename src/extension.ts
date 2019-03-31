import * as vscode from 'vscode';
export function activate(context: vscode.ExtensionContext) {

	console.log('Generating table of contents');

	let disposable = vscode.commands.registerCommand('extension.mdReadmeTableOfContents', () => {
		let contentStart = 0,
			contentEnd = 0,
			i = 0,
			headers: string[] = new Array();

		let editor = vscode.window.activeTextEditor;

		if (!editor) {
			return;
		}

		let regexp = new RegExp('##.*a name="(.*)"><.a>(.*)');

		for (let line of editor.document.getText().split(/\r?\n/)) {

			if (contentStart > 0 && line === '---' && i !== -1) {
				contentEnd = i;
				i = -1;
			}

			if (contentEnd === 0 && line === '---') {
				contentStart = i;
			}

			if (regexp.test(line)) {
				let header = regexp.exec(line);
				if (!header) {
					return;
				}
				let tag = header[1],
					name = header[2];

				if (tag.indexOf('subsubheader') >= 0) {
					headers.push(`\t* ##### [${name}](#${tag})`);
				} else if (tag.indexOf('subheader') >= 0) {
					headers.push(`* #### [${name}](#${tag})`);
				} else {
					headers.push(` ### [${name}](#${tag})`);
				}
			}
			i++;
		}

		editor.edit((textEdit) => {
			textEdit.replace(new vscode.Range(contentStart + 1, 0, contentEnd, 0), headers.join("\n") + "\n")
		});
	});

	context.subscriptions.push(disposable);
}

export function deactivate() { }
;