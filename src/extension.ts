import * as vscode from 'vscode';
import { exec } from 'child_process';
import { dirname } from 'path';

export function activate(context: vscode.ExtensionContext) {

	let disposable = vscode.commands.registerCommand('extension.ssdtAddToProject', () => {
		try {
			let editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}

			let fileName = editor.document.fileName;
			let s: SSDT = new SSDT();
			s.addFileToProject(fileName);
		} catch (e) {
			vscode.window.showErrorMessage(e);
		}
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.ssdtdDelFromProject', () => {
		try {

			let editor = vscode.window.activeTextEditor;
			if (!editor) {
				return;
			}

			new SSDT().deleteFileFromProject(editor.document.fileName);

		} catch (e) {
			vscode.window.showErrorMessage(e);
		}
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.bitBucketOpenPullRequestInBrowser', () => {

		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('Run this command on the open editor.');
			return;
		}

		let config: any = vscode.workspace.getConfiguration('markdown-table-of-contents').get('bitbucketRepositories');

		for (let setting of config) {
			if (editor.document.fileName.toLowerCase().startsWith(setting.folder.toLowerCase())) {
				let b = new Bitubcket(setting.repository, setting.project, setting.folder);
				b.openPullRequestUrlInDefaultBrowser(editor.document.fileName);
			}
		}
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.bambooOpenFeatureBuild', () => {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('Run this command on the open editor.');

			return;
		}

		new Atlassian().openBambooPlanUrlInBrowser(editor.document.fileName);
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.bambooQueueBuild', () => {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('Run this command on the open editor.');

			return;
		}

		new Atlassian().queueBambooPlan(editor.document.fileName);
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

		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		let git = new GIT();
		const clipboardy = require('clipboardy');

		git.getFeatureIdFromFileName(editor.document.fileName, (result: string) => {
			clipboardy.write(result);
		});

	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.gitCopyFeatureBranchToClipboard', () => {

		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		let git = new GIT();
		const clipboardy = require('clipboardy');

		git.getGitBranchFromFileName(editor.document.fileName, (result: string) => {
			clipboardy.write(result);
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

		exec('git rev-parse --abbrev-ref HEAD', {
			cwd: dirname(editor.document.fileName)
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
				cwd: dirname(e.document.fileName)
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
					`/*
---
created_by: ${name}
created_date: ${gitDate}
description: >
  description
jira_issues:
  - ${regex[0]}
...
*/`;
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


class Bitubcket {
	repository: string;
	project: string;
	folder: string;

	constructor(repository: string, project: string, folder: string) {
		this.repository = repository;
		this.project = project;
		this.folder = folder;
	}

	public openPullRequestUrlInDefaultBrowser(fileName: string) {
		exec('git rev-parse --abbrev-ref HEAD', {
			cwd: dirname(fileName)
		}, (err: (Error & { code?: string | number }) | null, branch: string, stderr: string) => {

			let config: any = vscode.workspace.getConfiguration('markdown-table-of-contents').get('bitbucketRepositories');

			if (!config) {
				vscode.window.showErrorMessage('Please set bitbucket configuration in workspace settings');
				return;
			}


			for (let setting of config) {
				if (fileName.toLowerCase().startsWith(setting.folder.toLowerCase())) {
					let url = `http://bitbucket.timepayment.com:7990/projects/${setting.project}/repos/${setting.repository}/compare/commits?sourceBranch=refs/heads/${branch}`;
					vscode.env.openExternal(vscode.Uri.parse(url));
				}
			}
		});
	}
}

class SSDT {
	sqlPackagePath: string = '';

	private getProjectConfigurationPath(locationFolder: string) {
		const fs = require('fs');
		let result = false;
		while (locationFolder.indexOf('\\') >= 0) {
			let tmp = locationFolder.split('\\');
			let projectFile = '';

			let workingDir = dirname(locationFolder);
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

	public addFileToProject(filePath: string) {
		let projFilePath = this.getProjectConfigurationPath(filePath);


		require('fs').readFile(projFilePath, 'utf8', function (err: string, content: string) {
			if (err) {
				vscode.window.showErrorMessage(err);
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
					let fileEntry = `    <Build Include="${filePath.replace(repl, '')}" />`;
					if (fileEntry.trim() === line.trim()) {
						vscode.window.showWarningMessage(`${filePath} already exists.`);
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
					vscode.window.showInformationMessage(`${filePath} is added to project.`);
				});
			}
		});
	}

	public deleteFileFromProject(filePath: string) {
		let projFilePath = this.getProjectConfigurationPath(filePath);

		var parser = require('xml2js');

		require('fs').readFile(projFilePath, 'utf8', function (err: string, content: string) {
			if (err) {
				vscode.window.showErrorMessage(err);
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
					let fileEntry = `    <Build Include="${filePath.replace(repl, '')}" />`;
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
					vscode.window.showInformationMessage(`${filePath} is added to project.`);
				});
			} else {
				vscode.window.showWarningMessage(`${filePath} is not found in the project.`);
			}
		});
	}
}

class GIT {

	async getFeatureIdFromFileName(filePath: string, cb: any) {
		this.getGitBranchFromFileName(filePath, (branch: string) => {
			let regex = new RegExp('([a-zA-Z].*)\\/([a-zA-Z]+-[0-9]{1,5}).*').exec(branch);

			if (!regex) {
				return;
			}

			cb(regex[2]);
		});
	}

	async getGitBranchFromFileName(filePath: string, cb: any) {
		const { exec } = require('child_process');

		exec('git rev-parse --abbrev-ref HEAD', {
			cwd: dirname(filePath)
		}, (err: (Error & { code?: string | number }) | null, branch: string, stderr: string) => {

			if (err) {
				console.log(err);
				return;
			}

			cb(branch.replace('\n', ''));
		});
	}
}

class Atlassian {
	async openBambooPlanUrlInBrowser(fileName: string) {
		new GIT().getGitBranchFromFileName(fileName, (branch: string) => {
			var config: any = vscode.workspace.getConfiguration('markdown-table-of-contents').get('bitbucketRepositories');
			for (var setting of config) {

				if (fileName.toLowerCase().startsWith(setting.folder.toLowerCase())) {
					branch = branch.replace('/', '-');
					let bambooHost = vscode.workspace.getConfiguration('markdown-table-of-contents').get('atlassianBambooHost');
					const request = require('request');

					request(
						{
							url: `${bambooHost}/rest/api/latest/plan/${setting.bambooPlanKey}/branch/${branch}.json`,
							headers: {
								"Authorization": 'Basic ' + vscode.workspace.getConfiguration('markdown-table-of-contents').get('atlassianAuthHash')
							}
						},
						(error: string, response: string, body: string) => {
							let planKey = JSON.parse(body).key;
							vscode.env.openExternal(vscode.Uri.parse(`${bambooHost}/browse/${planKey}`));
						}
					);

				}
			}
		});

	}
	async queueBambooPlan(fileName: string) {
		new GIT().getGitBranchFromFileName(fileName, (branch: string) => {
			var config: any = vscode.workspace.getConfiguration('markdown-table-of-contents').get('bitbucketRepositories');
			for (var setting of config) {

				if (fileName.toLowerCase().startsWith(setting.folder.toLowerCase())) {
					branch = branch.replace('/', '-');
					let bambooHost = vscode.workspace.getConfiguration('markdown-table-of-contents').get('atlassianBambooHost');
					const request = require('request');
					request(
						{
							url: `${bambooHost}/rest/api/latest/plan/${setting.bambooPlanKey}/branch/${branch}.json`,
							headers: {
								"Authorization": 'Basic ' + vscode.workspace.getConfiguration('markdown-table-of-contents').get('atlassianAuthHash')
							}
						},
						(error: string, response: string, body: string) => {

							var planKey = JSON.parse(body).key;
							request(
								{
									url: `${bambooHost}/rest/api/latest/queue/${planKey}`,
									headers: {
										"Authorization": 'Basic ' + vscode.workspace.getConfiguration('markdown-table-of-contents').get('atlassianAuthHash')
									},
									method: "post"
								},
								(error: string, response: any, body: string) => {
									if (String(response.body).indexOf('maximum number') >= 0) {
										vscode.window.showWarningMessage('Build is already running');
									}
									else if (String(response.body).indexOf('restQueuedBuild planKey') >= 0) {
										vscode.window.showInformationMessage('Build is queued');
									}
									else if (String(response.body).indexOf('<status-code>404</status-code>') >= 0) {
										vscode.window.showErrorMessage('Build is not found');
									}
									else {
										vscode.window.showErrorMessage(String(response.body));
									}
								}
							);							
						}
					);
					


				}
			}
		});

	}
}