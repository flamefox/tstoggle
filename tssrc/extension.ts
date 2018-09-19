import * as vscode from 'vscode';
import * as tsSwitcher from './tsSwitcher';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed

function activate(context: vscode.ExtensionContext) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    // console.log('Congratulations, your extension "tstoggle" is now active!');

    let cTsSwitcher = new tsSwitcher.CTsSwitcher();
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with  registerCommand
    // The commandId parameter must match the command field in package.json
    // The code you place here will be executed every time your command is executed

    // Display a message box to the user
    context.subscriptions.push(vscode.commands.registerCommand('extension.jstoggletots', async () => {
        try {
            await cTsSwitcher.switchJsToTs();
        } catch (error) {
            await vscode.window.showErrorMessage(error);
        }

    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.tstoggletojs', async () => {
        console.log('extension.tstoggletojs');
        try {
            await cTsSwitcher.switchTsToJs();
        } catch (error) {
            await vscode.window.showErrorMessage(error);
        }

    }));

    context.subscriptions.push(vscode.commands.registerCommand('extension.keyswitch', async () => {
        console.log('extension.keyswitch');
        try {
            let currentTextEditor = vscode.window.activeTextEditor;
            if (currentTextEditor) {
                let filePath = currentTextEditor.document.fileName;
                let ext = filePath.substr(filePath.lastIndexOf('.') + 1);
                if (ext === 'js') {
                    await cTsSwitcher.switchJsToTs();
                } else if (ext === 'ts') {
                    await cTsSwitcher.switchTsToJs();
                }
            }
        } catch (error) {
            await vscode.window.showErrorMessage(error);
        }
    }));

    // vscode.workspace.onDidOpenTextDocument(async (e) => {
    //     console.log('onDidOpenTextDocument');
    //     let currentTextEditor = vscode.window.activeTextEditor;
    //     if (currentTextEditor) {
    //         let filePath = currentTextEditor.document.fileName;

    //         let ext = filePath.substr(filePath.lastIndexOf('.') + 1);
    //         if (ext === 'js') {
    //             let ret = await vscode.window.showInformationMessage('jump to corresponding ts file ?', 'jump');

    //             if (ret === 'jump') {
    //                 await cTsSwitcher.switchJsToTs();
    //             }
    //         } else if (ext === 'ts') {
    //             let ret = await vscode.window.showInformationMessage('jump to corresponding js file ?', 'jump');
    //             if (ret === 'jump') {
    //                 await cTsSwitcher.switchTsToJs();
    //             }
    //         }
    //     }
    // });
}

exports.activate = activate;

// this method is called when your extension is deactivated
// tslint:disable-next-line:no-empty
function deactivate() {
}
exports.deactivate = deactivate;
