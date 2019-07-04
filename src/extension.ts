import * as vscode from 'vscode';
import { exec } from 'child_process';
import { dirname } from 'path';
import * as request from "request-promise-native";


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

		schemaIndex = splitSize - 3;
		objectTypeIndex = splitSize - 2;
		objectNameIndex = splitSize - 1;

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
		(async () => {
			try {
				var text = await git.getFeatureIdFromFileName(editor.document.fileName);
				clipboardy.write(text);
			} catch (err) {
				console.log(err);
				vscode.window.showErrorMessage('Error please check the log');
			}
		})();

	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.gitCopyFeatureBranchToClipboard', () => {

		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}

		let git = new GIT();
		const clipboardy = require('clipboardy');
		(async () => {
			try {
				var text = await git.getGitBranchFromFileName(editor.document.fileName);
				clipboardy.write(text);
			} catch (err) {
				console.log(err);
				vscode.window.showErrorMessage('Error please check the log');
			}
		})();
	});

	context.subscriptions.push(disposable);

	disposable = vscode.commands.registerCommand('extension.sqlGenerateYAMLComment', () => {
		let editor = vscode.window.activeTextEditor;
		if (!editor) {
			return;
		}
		const clipboardy = require('clipboardy');
		// const { exec } = require('child_process');
		let git = new GIT();

		(async () => {
			try {
				let e = vscode.window.activeTextEditor;
				if (!e) {
					return;
				}

				let branch = await git.getGitBranchFromFileName(editor.document.fileName);
				let firstDate = await git.execGitCmd('git log --diff-filter=A --follow --format=%aD -1 -- ' + e.document.fileName, editor.document.fileName);
				const name = vscode.workspace.getConfiguration('markdown-table-of-contents').get('userFullName');

				let gitDate = '';
				if (String(firstDate).split('\n').length >= 1) {
					let gitDateArr = String(firstDate).split(' ');
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
			} catch (err) {
				console.log(err);
				vscode.window.showErrorMessage('Error please check the log');
			}
		})();


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
		(async () => {
			try {
				let branch = await new GIT().getGitBranchFromFileName(fileName);
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
			} catch (err) {
				console.log(err);
				vscode.window.showErrorMessage('Error please check the log');
			}
		})();
	}
}

class SSDT {
	sqlPackagePath: string = '';

	private getProjectConfigurationPath(locationFolder: string) {
		const fs = require('fs');
		let result = false;
		while (locationFolder.indexOf('\\') >= 0) {
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
				(async () => {
					try {
						const util = require('util');
						const fs_writeFile = util.promisify(require('fs').writeFile);
						await fs_writeFile(projFilePath, lines.join('\n'));
						vscode.window.showInformationMessage(`${filePath} is added to project.`);
					} catch (err) {
						console.log(err);
						vscode.window.showErrorMessage('Error please check the log');
					}
				})();
			}
		});
	}

	public deleteFileFromProject(filePath: string) {
		let projFilePath = this.getProjectConfigurationPath(filePath);

		(async () => {
			try {
				const util = require('util');
				const fs_readFile = util.promisify(require('fs').readFile);
				let content = await fs_readFile(projFilePath, 'utf8');

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
					const util = require('util');
					const fs_writeFile = util.promisify(require('fs').writeFile);
					await fs_writeFile(projFilePath, lines.join('\n'));
					vscode.window.showInformationMessage(`${filePath} is deleted from project.`);
				} else {
					vscode.window.showWarningMessage(`${filePath} is not found in the project.`);
				}

			} catch (err) {
				console.log(err);
				vscode.window.showErrorMessage('Error please check the log');
			}
		})();
	}
}

class GIT {

	async getFeatureIdFromFileName(filePath: string): Promise<string> {
		let branch = await this.getGitBranchFromFileName(filePath);
		let regex = new RegExp('([a-zA-Z].*)\\/([a-zA-Z]+-[0-9]{1,5}).*');
		let regexMatch = regex.exec(branch);

		if (regexMatch === null) {
			return '';
		}

		return regexMatch[2];

	}

	async execGitCmd(cmd: string, path: string) {
		return await new Promise((resolve, reject) => {
			exec(cmd, {
				cwd: dirname(path)
			}, (err: (Error & { code?: string | number }) | null, result: string, stderr: string) => {
				if (err !== null) {
					vscode.window.showErrorMessage('Error check the log');
					console.log(err);
					return reject();
				}
				resolve(result);
			});
		});
	}

	async getGitBranchFromFileName(filePath: string): Promise<string> {
		let branch = await this.execGitCmd('git rev-parse --abbrev-ref HEAD', filePath);
		String(branch).replace('\n', '');
		return String(branch).replace('\n', '');
	}
}

class Atlassian {

	private bambooRepositorySettings(config: any, fileName: string): any {
		for (var setting of config) {
			if (fileName.toLowerCase().startsWith(setting.folder.toLowerCase())) {
				return setting;
			}
		}
	}

	async getRequest(uri: string): Promise<any> {
		var options = {
			uri: uri,
			headers: {
				"Authorization": 'Basic ' + vscode.workspace.getConfiguration('markdown-table-of-contents').get('atlassianAuthHash')
			},
			json: true
		};

		try {
			const result = await request.get(options);
			return result;
		}
		catch (err) {
			console.log(err);
			throw (err);
		}
	}

	async postRequest(uri: string): Promise<any> {
		var options = {
			uri: uri,
			headers: {
				"Authorization": 'Basic ' + vscode.workspace.getConfiguration('markdown-table-of-contents').get('atlassianAuthHash')
			},
			method: 'POST',
			json: true
		};

		try {
			const result = await request(options);
			return result;
		}
		catch (err) {
			console.log(err);
			throw (err);
		}
	}

	async putRequest(uri: string): Promise<any> {
		var options = {
			uri: uri,
			headers: {
				"Authorization": 'Basic ' + vscode.workspace.getConfiguration('markdown-table-of-contents').get('atlassianAuthHash')
			},
			method: 'PUT',
			json: true
		};

		try {
			const result = await request(options);
			return result;
		}
		catch (err) {
			console.log(err);
			throw (err);
		}
	}

	async getBambooPlanKey(fileName: string, bambooHost: string | undefined): Promise<string> {
		var branch = await new GIT().getGitBranchFromFileName(fileName);

		var config: any = vscode.workspace.getConfiguration('markdown-table-of-contents').get('bitbucketRepositories');
		var setting = this.bambooRepositorySettings(config, fileName);

		branch = branch.replace('/', '-');

		try {
			let uri = `${bambooHost}/rest/api/latest/plan/${setting.bambooPlanKey}/branch/${branch}.json`;
			let result = await this.getRequest(uri);
			return result.key;
		}
		catch (err) {
			vscode.window.showErrorMessage('Error please check the log');
			console.log(err);
			throw err;
		}

	}

	async openBambooPlanUrlInBrowser(fileName: string) {
		try {
			var bambooHost: string | undefined = vscode.workspace.getConfiguration('markdown-table-of-contents').get('atlassianBambooHost'),
				planKey = await this.getBambooPlanKey(fileName, bambooHost);
			vscode.env.openExternal(vscode.Uri.parse(`${bambooHost}/browse/${planKey}`));
			return;
		}
		catch (err) {
			if (err.message === "Cannot read property 'key' of undefined") {
				try {
					let plan = await this.createBambooPlan(fileName);
					vscode.env.openExternal(vscode.Uri.parse(`${bambooHost}/browse/${plan.key}`));
				} catch (err) {
					vscode.window.showErrorMessage('Error please check the log');
					console.log(err);
					return;
				}
			}
			vscode.window.showErrorMessage('Error please check the log');
			console.log(err);
		}
	}

	async queueBambooPlan(fileName: string) {
		try {
			var bambooHost: string | undefined = vscode.workspace.getConfiguration('markdown-table-of-contents').get('atlassianBambooHost');
			let planKey = await this.getBambooPlanKey(fileName, bambooHost);
			let uri = `${bambooHost}/rest/api/latest/queue/${planKey}`;
			let response = await this.postRequest(uri);
			vscode.window.showInformationMessage('Build is queued');
			return response;
		}
		catch (err) {
			if (String(err).indexOf('maximum number') >= 0) {
				vscode.window.showWarningMessage('Build is already running');
			}
			else if (String(err).indexOf('<status-code>404</status-code>') >= 0) {
				vscode.window.showErrorMessage('Build is not found');
				await this.createBambooPlan(fileName);

			} else if (err.message === "Cannot read property 'key' of undefined") {
				let plan = await this.createBambooPlan(fileName);
				let uri = `${bambooHost}/rest/api/latest/queue/${plan.key}`;
				let response = await this.postRequest(uri);
				vscode.window.showInformationMessage('Build is queued');
				return response;
			}
			else {
				vscode.window.showErrorMessage('Error please check the log');
				console.log(err);
			}
		}
	}

	async createBambooPlan(fileName: string) {
		let bambooHost: string | undefined = vscode.workspace.getConfiguration('markdown-table-of-contents').get('atlassianBambooHost'),
			branchName = await new GIT().getGitBranchFromFileName(fileName),
			uri = `${bambooHost}/rest/api/latest/plan/MOR-DB/branch/${branchName.replace('/', '-')}?vcsBranch=refs/heads/feature/REPORTREPO-644-remove-delinquency_profiling`;

		try {
			let response = await this.putRequest(uri);
			vscode.window.showInformationMessage('Branch plan is created');
			return response;
		}
		catch (err) {
			vscode.window.showErrorMessage('Error please check the log');
			console.log(err);
		}
	}
}