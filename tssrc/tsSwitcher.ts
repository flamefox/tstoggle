import * as sourceMap from 'source-map';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from './putil';
import * as vscode from 'vscode';
import * as stripJsonComments from 'strip-json-comments';

export class CTsSwitcher {

    // tslint:disable-next-line:no-empty
    constructor() {
    }

    public IsExstsFile(filespec: string) {

        if (path.isAbsolute(filespec)) {
            if (fs.existsSync(filespec)) {
                return true;
            } else {
                return false;
            }
        } else {
            let readPath = path.join(vscode.workspace.rootPath, filespec);
            if (fs.existsSync(readPath)) {
                return true;
            } else {
                return false;
            }
        }
        return false;
    }

    public async showFileInEditor(filePath: string) {
        if (filePath.length <= 0) {
            return null;
        }

        if (!path.isAbsolute(filePath)) {
            filePath = path.join(vscode.workspace.rootPath, filePath);
        }

        let doc = await vscode.workspace.openTextDocument(filePath);
        let column = vscode.window.activeTextEditor.viewColumn;
        return await vscode.window.showTextDocument(doc, column);
    }

    public async switchJsToTs() {
        let currentTextEditor = vscode.window.activeTextEditor;
        if (!currentTextEditor) {
            return;
        }
        let filePath: string = currentTextEditor.document.fileName;
        let suffixIndex = filePath.lastIndexOf('.');
        if (suffixIndex === -1) {
            return;
        } else {
            let suffixStr = filePath.substr(suffixIndex + 1);
            if (suffixStr !== 'js') {
                return;
            }
        }

        let jsName = path.basename(filePath);
        // filePath.substr(filePath.lastIndexOf('\\') + 1);
        let tsName = jsName.replace('.js', '.ts');

        let mapFilePath = `${filePath}${'.map'}`;
        if (this.IsExstsFile(mapFilePath)) {
            let mapFileContent = await promisify<string, string, string>(fs.readFile)(mapFilePath, 'utf8');
            if (mapFileContent.length == null) {
                throw `"${mapFilePath}" is empty!`;
            }

            // 建立master.json的JSON对象
            let mapJsonObj = JSON.parse(stripJsonComments(mapFileContent));
            let tsPath = `${mapJsonObj.sourceRoot}${mapJsonObj.sources[0]}`;
            if (!this.IsExstsFile(tsPath)) {
                throw `"${tsPath}" do not exist!`;
            }

            // 获取当前光标位置
            let editorSelections = vscode.window.activeTextEditor.selections;

            // 把光标定位到对应的位置
            let smc = new sourceMap.SourceMapConsumer(mapJsonObj);
            let newSelections: vscode.Selection[] = [];
            for (let selection of editorSelections) {

                let activePos = smc.originalPositionFor({
                    line: selection.active.line,
                    column: selection.active.character,
                });
                if (activePos.line === null || activePos.column === null) {
                    continue;
                }
                let newActivePos = new vscode.Position(activePos.line, activePos.column);

                let anchorPos = smc.originalPositionFor({
                    line: selection.anchor.line,
                    column: selection.anchor.character,
                });
                if (anchorPos.line === null || anchorPos.column === null) {
                    continue;
                }
                let newAnchorPos = new vscode.Position(anchorPos.line, anchorPos.column);

                let newSelection = new vscode.Selection(newAnchorPos, newActivePos);
                newSelections.push(newSelection);
            }

            // 在vscode中打开ts文件
            let newEditor = await this.showFileInEditor(tsPath);
            newEditor.selection = newSelections[0];
            newEditor.selections = newSelections;
            const range = new vscode.Range(newEditor.selection.start, newEditor.selection.end);
            newEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        } else {

            let tsRoot = vscode.workspace.rootPath;
            let outDir = vscode.workspace.rootPath;
            if (this.IsExstsFile('tsconfig.json')) {
                let tsConfigPath = path.join(vscode.workspace.rootPath, 'tsconfig.json'); // await vscode.workspace.findFiles('tsconfig', '', 1)[0];
                let tsConfigFileContent = await promisify<string, string, string>(fs.readFile)(tsConfigPath, 'utf8');
                if (tsConfigFileContent.length == null) {
                    throw `"${tsConfigPath}" is empty!`;
                }

                let rootDir = '';

                let tsConfigJsonObj;
                try {
                    tsConfigJsonObj = JSON.parse(stripJsonComments(tsConfigFileContent));
                } catch (error) {
                    console.log(error.message);
                    throw error;
                }
                if (tsConfigJsonObj && tsConfigJsonObj.compilerOptions && tsConfigJsonObj.compilerOptions.rootDir) {
                    rootDir = tsConfigJsonObj.compilerOptions.rootDir;
                }

                if (tsConfigJsonObj && tsConfigJsonObj.compilerOptions && tsConfigJsonObj.compilerOptions.outDir) {
                    outDir = tsConfigJsonObj.compilerOptions.outDir;
                    outDir = path.join(vscode.workspace.rootPath, outDir);
                }

                tsRoot = path.join(vscode.workspace.rootPath, rootDir);

            }

            let jsFolder = filePath.replace(outDir, '').replace(jsName, '');
            let tsPath = path.join(tsRoot, jsFolder, tsName);

            let editorSelections = vscode.window.activeTextEditor.selections;
            let newEditor = await this.showFileInEditor(tsPath);

            newEditor.selection = editorSelections[0];
            newEditor.selections = editorSelections;
            const range = new vscode.Range(newEditor.selection.start, newEditor.selection.end);
            newEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        }

    }

    public async switchTsToJs() {
        console.log('switch ts to js');
        let currentTextEditor = vscode.window.activeTextEditor;
        if (!currentTextEditor) {
            throw 'err1';
        }
        let filePath: string = currentTextEditor.document.fileName;
        let suffixIndex = filePath.lastIndexOf('.');
        if (suffixIndex === -1) {
            throw 'err2';
        } else {
            let suffixStr = filePath.substr(suffixIndex + 1);
            if (suffixStr !== 'ts') {
                throw 'err3';
            }
        }

        let tsName = path.basename(filePath);
        // filePath.substr(filePath.lastIndexOf('\\') + 1);
        let jsName = tsName.replace('.ts', '.js');

        let tsRoot = vscode.workspace.rootPath;
        let outDir = '';
        if (this.IsExstsFile('tsconfig.json')) {
            let tsConfigPath = path.join(vscode.workspace.rootPath, 'tsconfig.json'); // await vscode.workspace.findFiles('tsconfig', '', 1)[0];
            let tsConfigFileContent = await promisify<string, string, string>(fs.readFile)(tsConfigPath, 'utf8');
            if (tsConfigFileContent.length == null) {
                throw `"${tsConfigPath}" is empty!`;
            }

            let rootDir = '';

            let tsConfigJsonObj;
            try {
                tsConfigJsonObj = JSON.parse(stripJsonComments(tsConfigFileContent));
            } catch (error) {
                console.log(error.message);
                throw error;
            }
            if (tsConfigJsonObj && tsConfigJsonObj.compilerOptions && tsConfigJsonObj.compilerOptions.rootDir) {
                rootDir = tsConfigJsonObj.compilerOptions.rootDir;
            }

            if (tsConfigJsonObj && tsConfigJsonObj.compilerOptions && tsConfigJsonObj.compilerOptions.outDir) {
                outDir = tsConfigJsonObj.compilerOptions.outDir;
            }

            tsRoot = path.join(vscode.workspace.rootPath, rootDir);

        }

        let tsFolder = filePath.replace(tsRoot, '').replace(tsName, '');
        let jsPath = path.join(vscode.workspace.rootPath, outDir, tsFolder, jsName);

        if (!this.IsExstsFile(jsPath)) {
            throw `"${jsPath}" do not exist!`;
        }
        let jsMapPath = `${jsPath}${'.map'}`;
        if (this.IsExstsFile(jsMapPath)) {

            let mapFileContent = await promisify<string, string, string>(fs.readFile)(jsMapPath, 'utf8');
            if (mapFileContent.length == null) {
                throw `"${jsMapPath}" is empty!`;
            }

            // 建立master.json的JSON对象
            let mapJsonObj = JSON.parse(stripJsonComments(mapFileContent));

            // 获取当前光标位置
            let editorSelections = vscode.window.activeTextEditor.selections;

            // 把光标定位到对应的位置
            let smc = new sourceMap.SourceMapConsumer(mapJsonObj);
            let newSelections: vscode.Selection[] = [];
            for (let selection of editorSelections) {

                let activePos = smc.generatedPositionFor({
                    source: filePath.replace(tsRoot + path.sep, '').replace(/\\/g, '/'),
                    line: selection.active.line,
                    column: selection.active.character,
                });
                if (activePos.line === null || activePos.column === null) {
                    continue;
                }
                let newActivePos = new vscode.Position(activePos.line, activePos.column);

                let anchorPos = smc.generatedPositionFor({
                    source: filePath.replace(tsRoot + path.sep, '').replace(/\\/g, '/'),
                    line: selection.anchor.line,
                    column: selection.anchor.character,
                });
                if (anchorPos.line === null || anchorPos.column === null) {
                    continue;
                }
                let newAnchorPos = new vscode.Position(anchorPos.line, anchorPos.column);

                let newSelection = new vscode.Selection(newAnchorPos, newActivePos);
                newSelections.push(newSelection);
            }

            // 在vscode中打开ts文件
            let newEditor = await this.showFileInEditor(jsPath);
            newEditor.selection = newSelections[0];
            newEditor.selections = newSelections;
            const range = new vscode.Range(newEditor.selection.start, newEditor.selection.end);
            newEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        } else {
            let editorSelections = vscode.window.activeTextEditor.selections;
            let newEditor = await this.showFileInEditor(jsPath);

            newEditor.selection = editorSelections[0];
            newEditor.selections = editorSelections;
            const range = new vscode.Range(newEditor.selection.start, newEditor.selection.end);
            newEditor.revealRange(range, vscode.TextEditorRevealType.InCenter);
        }

    }
}
