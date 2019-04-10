import * as vscode from 'vscode';


export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('extension.ssdtAddToProject', () => {
		try {
			let msBuildPath = vscode.workspace.getConfiguration('markdown-table-of-contents').get('msBuildPath');

			if (msBuildPath === undefined) {
				vscode.window.showErrorMessage('MSBuild.exe path is not set in the extension settings.');
				return;
			}

			let editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}

			let fileName = editor.document.fileName;
			let s: SSDT = new SSDT(msBuildPath.toString());
			let projFilePath = s.getProjectConfigurationPath(fileName);

			var parser = require('xml2js');

			require('fs').readFile(projFilePath, 'utf8', function (err: string, content: string) {
				if (err) {
					let a = 0;
				}
				let lines: string[] = [];

				if (!projFilePath) {
					return;
				}
				let isAdded = false;
				for (let line of content.split('\n')) {
					if (line.indexOf('<Build Include=') >= 0 && !isAdded) {
						let t = projFilePath.split('\\');
						let repl = t.slice(0, t.length - 1).join('\\') + '\\';
						let fileEntry = `    <Build Include="${fileName.replace(repl, '')}" />`;
						if (fileEntry.trim() === line.trim()) {
							vscode.window.showWarningMessage(`${fileName} already exists.`);
							return;
						}
						if (fileEntry.trim() < line.trim()) {
							lines.push(fileEntry);
							isAdded = true;
						}
					}
					lines.push(line);
				}
				if (isAdded) {
					require('fs').writeFile(projFilePath, lines.join('\n'), function (err: string) {
						if (err) {
							vscode.window.showErrorMessage('Project file can\'t be modified');
							console.log(err);
							return;
						}
						vscode.window.showInformationMessage(`${fileName} is added to project.`);
					});
				}
			});
		} catch (e) {
			vscode.window.showErrorMessage(e);
		}
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.ssdtdDelFromProject', () => {
		try {
			let msBuildPath = vscode.workspace.getConfiguration('markdown-table-of-contents').get('msBuildPath');

			if (msBuildPath === undefined) {
				vscode.window.showErrorMessage('MSBuild.exe path is not set in the extension settings.');
				return;
			}

			let editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}

			let fileName = editor.document.fileName;
			let s: SSDT = new SSDT(msBuildPath.toString());
			let projFilePath = s.getProjectConfigurationPath(fileName);

			var parser = require('xml2js');

			require('fs').readFile(projFilePath, 'utf8', function (err: string, content: string) {
				if (err) {
					let a = 0;
				}

				let lines: string[] = [];

				if (!projFilePath) {
					return;
				}
				let isDeleted = false;

				for (let line of content.split('\n')) {
					if (line.indexOf('<Build Include=') >= 0 && !isDeleted) {
						let t = projFilePath.split('\\');
						let repl = t.slice(0, t.length - 1).join('\\') + '\\';
						let fileEntry = `    <Build Include="${fileName.replace(repl, '')}" />`;
						if (fileEntry.trim() === line.trim()) {
							isDeleted = true;
							continue;
						}
					}
					lines.push(line);
				}

				if (isDeleted) {
					require('fs').writeFile(projFilePath, lines.join('\n'), function (err: string) {
						if (err) {
							vscode.window.showErrorMessage('Project file can\'t be modified');
							console.log(err);
							return;
						}
						vscode.window.showInformationMessage(`${fileName} is added to project.`);
					});
				} else {
					vscode.window.showWarningMessage(`${fileName} is not found in the project.`);
				}
			});
		} catch (e) {
			vscode.window.showErrorMessage(e);
		}
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.ssdtBuildProject', () => {
		let msBuildPath = vscode.workspace.getConfiguration('markdown-table-of-contents').get('msBuildPath');

		if (msBuildPath === undefined) {
			vscode.window.showErrorMessage('MSBuild.exe path is not set in the extension settings.');
			return;
		}
		let s: SSDT = new SSDT(msBuildPath.toString());
		let folder = 'E:\\Source\\rdb-custom\\rdb_custom\\Schemas\\dbo\\Functions';
		let projFile = s.getProjectConfigurationPath(folder);
		vscode.workspace.getConfiguration('markdown-table-of-contents').set('projFile', projFile);
		let projFile2 = vscode.workspace.getConfiguration('markdown-table-of-contents').get('projFile');
		vscode.commands.executeCommand("workbench.action.tasks.runTask", "SSDT build");

		// vscode.window.createOutputChannel("SSDT build");
		// s.build(folder);
		let a = 0;

	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.mdReadmeTableOfContents', () => {
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
			textEdit.replace(new vscode.Range(contentStart + 1, 0, contentEnd, 0), headers.join("\n") + "\n");
		});
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.sqlGenerateExtendedPropertyComment', () => {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		let tmp = editor.document.fileName.split('\\');
		// let tmp = editor.document.fileName.replace('e:\\Source\\rdb-custom\\rdb_custom\\Schemas\\', '').split('\\');
		let schemaIndex = 0,
			objectTypeIndex = 0,
			objectNameIndex = 0,
			splitSize = tmp.length;

		if (tmp[splitSize - 4] === 'Schemas') {
			schemaIndex = splitSize - 3;
			objectTypeIndex = splitSize - 2;
			objectNameIndex = splitSize - 1;
		}

		let schemaName = tmp[schemaIndex],
			objectType = tmp[objectTypeIndex].substring(0, tmp[objectTypeIndex].length - 1),
			objectName = tmp[objectNameIndex].replace('.sql', ''),
			extProp = `
EXEC sys.sp_addextendedproperty @name = 'MS_Description'
                              , @value = 'ENTER YOUR COMMENT HERE'
                              , @level0type = 'SCHEMA'
                              , @level0name = '${schemaName}'
                              , @level1type = '${objectType.toUpperCase()}'
                              , @level1name = '${objectName}'
                              , @level2type = NULL
                              , @level2name = NULL;	
GO`;
		const position = editor.selection.active;
		let newPosition = position.with(position.line, 0);

		editor.edit((textEdit) => {

			textEdit.insert(newPosition, extProp);
		});
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.gitInitialCommitMessageClipboard', () => {
		const clipboardy = require('clipboardy');
		const { exec } = require('child_process');
		const path = require('path');
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		exec('git rev-parse --abbrev-ref HEAD', {
			cwd: path.dirname(editor.document.fileName)
		}, (err: (Error & { code?: string | number }) | null, branch: string, stderr: string) => {

			if (err) {
				console.log(err);
				return;
			}
			// let initialCommitMessage = '\n\n' + branch.split('/')[1];
			let regex = new RegExp('(.*-[0-9]{1,4})').exec(branch.split('/')[1]);
			if (!regex) {
				return;
			}

			clipboardy.writeSync(regex[0]);
		});

	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.sqlGenerateYAMLComment', () => {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		const clipboardy = require('clipboardy');
		const { exec } = require('child_process');
		const path = require('path');

		exec('git rev-parse --abbrev-ref HEAD', {
			cwd: path.dirname(editor.document.fileName)
		}, (err: (Error & { code?: string | number }) | null, branch: string, stderr: string) => {

			let e = vscode.window.activeTextEditor;
			if (!e) {
				return;
			}

			if (err) {
				console.log(err);
				return;
			}
			let initialCommitMessage = '\n\n' + branch.split('/')[1];


			exec('git log --diff-filter=A --follow --format=%aD -1 -- ' + e.document.fileName, {
				cwd: path.dirname(e.document.fileName)
			}, (err: (Error & { code?: string | number }) | null, firstDate: string, stderr: string) => {
				if (err) {
					console.log(err);
					return;
				}
				let e = vscode.window.activeTextEditor;

				// vscode.workspace.getConfiguration('markdown-table-of-contents').update('author_name', 'Dmitrij Kultasev')
				const name = vscode.workspace.getConfiguration('markdown-table-of-contents').get('userFullName');


				if (!e) {
					return;
				}

				let gitDate = '';
				if (firstDate.length > 1) {
					let gitDateArr = firstDate.split(' ');
					gitDate = `${gitDateArr[1]}-${gitDateArr[2]}-${gitDateArr[3]}`;
				} else {
					let parts = new Date(Date.now()).toDateString().split(' ');
					gitDate = `${parts[2]}-${parts[1]}-${parts[3]}`;
				}
				let regex = new RegExp('(.*-[0-9]{1,4})').exec(branch.split('/')[1]);
				if (!regex) {
					return;
				}
				if (gitDate.length === 10) {
					gitDate = '0' + gitDate;
				}
				let yaml =
					`
/*
---
created_by: ${name}
created_date: ${gitDate}
description: >
  description
jira_issues:
  - ${regex[0]}
...
*/
`;
				const position = e.selection.active;
				let newPosition = position.with(position.line, 0);

				e.edit((textEdit) => {

					textEdit.insert(newPosition, yaml);
				});
			});


		});


	});

	context.subscriptions.push(disposable);

}

export function deactivate() { }


class SSDT {
	msbuildPath: string;
	sqlPackagePath: string = '';

	constructor(msbuildPath: string) {
		this.msbuildPath = msbuildPath;
	}

	build(locationFolder: string): void {
		const { exec } = require('child_process');
		const path = require('path');

		let sqlProjPath = this.getProjectConfigurationPath(locationFolder);
		let msBuildCmd = '\"' + this.msbuildPath + '\" \"' + sqlProjPath + '\" /p:Configuration=Release /t:Build';
		exec(msBuildCmd, {
			cwd: path.dirname(locationFolder)
		}, (err: (Error & { code?: string | number }) | null, firstDate: string, stderr: string) => {
			if (err) {
				vscode.window.showErrorMessage(firstDate);
				console.log(err);
				return;
			}

			let a = 0;

		});

		let a = 0;
	}

	public getProjectConfigurationPath(locationFolder: string) {
		const path = require('path');
		const fs = require('fs');
		let result = false;
		while (locationFolder.indexOf('\\') >= 0) {
			let tmp = locationFolder.split('\\');
			let projectFile = '';
			
			let workingDir = path.dirname(locationFolder);
			let dirs = fs.readdirSync(workingDir);
			for (let file of dirs) {
				if (file.indexOf('.sqlproj') >= 0) {
						result = true;
						projectFile = file;
						return `${workingDir}\\${file}`;
			}
		}
		    if (require('fs').existsSync(projectFile)) {
				return projectFile;
			}

			locationFolder = locationFolder.substring(0, locationFolder.lastIndexOf('\\'));
		}
	}

}