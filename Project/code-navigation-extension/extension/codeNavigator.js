const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

class CodeNavigator {
    constructor(context) {
        this.context = context;
        this.functionDefinitions = new Map();
        this.functionCalls = new Map();
        this.symbols = new Map(); // 存储所有符号
        this.dependencies = new Map(); // 存储依赖关系
        this.bookmarks = []; // 存储书签
        this.projectRoot = vscode.workspace.rootPath;
        this.cacheFile = path.join(context.globalStorageUri.fsPath, 'navigationData.json');
        this.bookmarksFile = path.join(context.globalStorageUri.fsPath, 'bookmarks.json');
        this.isScanning = false;
        this.lastScanTime = 0;
        this.scanInterval = 3600000; // 1 hour in milliseconds
    }

    async initialize() {
        console.log('初始化代码导航器...');
        
        // Create global storage directory if it doesn't exist
        const storageDir = path.dirname(this.cacheFile);
        if (!fs.existsSync(storageDir)) {
            fs.mkdirSync(storageDir, { recursive: true });
        }

        // Load cached data if available
        await this.loadCache();
        await this.loadBookmarks();
        
        // Check if we need to rescan
        if (this.shouldRescan()) {
            await this.scanProject();
        }
    }

    shouldRescan() {
        if (this.lastScanTime === 0) {
            return true; // Never scanned
        }
        const timeSinceLastScan = Date.now() - this.lastScanTime;
        return timeSinceLastScan > this.scanInterval;
    }

    async loadCache() {
        try {
            if (fs.existsSync(this.cacheFile)) {
                const data = await readFile(this.cacheFile, 'utf8');
                const parsed = JSON.parse(data);
                
                this.functionDefinitions = new Map(parsed.functionDefinitions || []);
                this.functionCalls = new Map(parsed.functionCalls || []);
                this.symbols = new Map(parsed.symbols || []);
                this.dependencies = new Map(parsed.dependencies || []);
                this.lastScanTime = parsed.lastScanTime || 0;
                
                console.log('导航缓存加载成功');
                vscode.window.showInformationMessage('代码导航数据已从缓存加载');
            }
        } catch (error) {
            console.error('Error loading cache:', error);
        }
    }

    async saveCache() {
        try {
            const data = {
                functionDefinitions: Array.from(this.functionDefinitions),
                functionCalls: Array.from(this.functionCalls),
                symbols: Array.from(this.symbols),
                dependencies: Array.from(this.dependencies),
                lastScanTime: this.lastScanTime
            };
            
            await writeFile(this.cacheFile, JSON.stringify(data, null, 2), 'utf8');
            console.log('导航缓存保存成功');
        } catch (error) {
            console.error('Error saving cache:', error);
        }
    }

    async loadBookmarks() {
        try {
            if (fs.existsSync(this.bookmarksFile)) {
                const data = await readFile(this.bookmarksFile, 'utf8');
                this.bookmarks = JSON.parse(data);
                console.log('书签加载成功');
            }
        } catch (error) {
            console.error('加载书签失败:', error);
        }
    }

    async saveBookmarks() {
        try {
            await writeFile(this.bookmarksFile, JSON.stringify(this.bookmarks, null, 2), 'utf8');
            console.log('书签保存成功');
        } catch (error) {
            console.error('保存书签失败:', error);
        }
    }

    async scanProject() {
        if (this.isScanning) {
            vscode.window.showWarningMessage('项目扫描已经在进行中');
            return;
        }

        this.isScanning = true;
        const startTime = Date.now();
        
        vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: '正在扫描项目以进行代码导航...',
            cancellable: true
        }, async (progress, token) => {
            try {
                // Clear existing data
                this.functionDefinitions.clear();
                this.functionCalls.clear();
                this.symbols.clear();
                this.dependencies.clear();
                
                // Scan all files
                await this.scanDirectory(this.projectRoot, progress, token);
                
                if (!token.isCancellationRequested) {
                    this.lastScanTime = Date.now();
                    await this.saveCache();
                    
                    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
                    const message = `项目扫描完成，用时 ${elapsed} 秒。找到 ${this.functionDefinitions.size} 个函数、${this.functionCalls.size} 个函数调用、${this.symbols.size} 个符号和 ${this.dependencies.size} 个依赖关系。`;
                    
                    vscode.window.showInformationMessage(message);
                    console.log(message);
                }
            } catch (error) {
                vscode.window.showErrorMessage(`扫描项目时出错: ${error.message}`);
                console.error('扫描错误:', error);
            } finally {
                this.isScanning = false;
            }
        });
    }

    async scanDirectory(directory, progress, token) {
        try {
            const entries = await readdir(directory);
            
            for (const entry of entries) {
                if (token.isCancellationRequested) {
                    return;
                }

                const fullPath = path.join(directory, entry);
                const stats = await stat(fullPath);
                
                if (stats.isDirectory()) {
                    // Skip certain directories
                    if (!this.shouldSkipDirectory(entry)) {
                        await this.scanDirectory(fullPath, progress, token);
                    }
                } else if (stats.isFile() && this.shouldScanFile(entry)) {
                    progress.report({ message: `正在扫描: ${entry}` });
                    await this.scanFile(fullPath);
                }
            }
        } catch (error) {
            console.error(`Error scanning directory ${directory}:`, error);
        }
    }

    shouldSkipDirectory(dirName) {
        const skipDirs = ['.git', '.vscode', 'node_modules', 'build', 'out', 'bin', 'dist', 'coverage'];
        return skipDirs.includes(dirName) || dirName.startsWith('.');
    }

    shouldScanFile(fileName) {
        const extensions = ['.c', '.cpp', '.h', '.hpp', '.java', '.py', '.js', '.ts'];
        return extensions.some(ext => fileName.endsWith(ext));
    }

    async scanFile(filePath) {
        try {
            const content = await readFile(filePath, 'utf8');
            
            // Scan for function definitions
            this.scanFunctionDefinitions(filePath, content);
            
            // Scan for function calls
            this.scanFunctionCalls(filePath, content);
            
            // Scan for symbols
            this.scanSymbols(filePath, content);
            
            // Scan for dependencies
            this.scanDependencies(filePath, content);
            
        } catch (error) {
            console.error(`Error scanning file ${filePath}:`, error);
        }
    }

    scanFunctionDefinitions(filePath, content) {
        const lines = content.split('\n');
        
        // C/C++ function definitions
        const cPattern = /(\w+)\s*\([^)]*\)\s*\{/g;
        let match;
        
        while ((match = cPattern.exec(content)) !== null) {
            const funcName = match[1];
            const lineNum = content.substring(0, match.index).split('\n').length;
            
            if (!this.functionDefinitions.has(funcName)) {
                this.functionDefinitions.set(funcName, []);
            }
            
            this.functionDefinitions.get(funcName).push({
                file: filePath,
                line: lineNum,
                signature: match[0].substring(0, 100)
            });
        }
        
        // Python function definitions
        const pyPattern = /def\s+(\w+)\s*\([^)]*\)\s*:/g;
        
        while ((match = pyPattern.exec(content)) !== null) {
            const funcName = match[1];
            const lineNum = content.substring(0, match.index).split('\n').length;
            
            if (!this.functionDefinitions.has(funcName)) {
                this.functionDefinitions.set(funcName, []);
            }
            
            this.functionDefinitions.get(funcName).push({
                file: filePath,
                line: lineNum,
                signature: match[0].substring(0, 100)
            });
        }
    }

    scanFunctionCalls(filePath, content) {
        const lines = content.split('\n');
        
        // General function call pattern
        const callPattern = /\b(\w+)\s*\(/g;
        let match;
        
        while ((match = callPattern.exec(content)) !== null) {
            const funcName = match[1];
            const lineNum = content.substring(0, match.index).split('\n').length;
            
            // Skip if this is a function definition
            const surroundingText = content.substring(Math.max(0, match.index - 50), match.index + 50);
            if (surroundingText.includes('{') && surroundingText.includes(')')) {
                continue;
            }
            
            if (!this.functionCalls.has(funcName)) {
                this.functionCalls.set(funcName, []);
            }
            
            this.functionCalls.get(funcName).push({
                file: filePath,
                line: lineNum
            });
        }
    }

    scanSymbols(filePath, content) {
        const lines = content.split('\n');
        
        // C/C++ symbols (variables, structs, classes, enums)
        const cSymbols = /(?:int|float|double|char|bool|void|struct|class|enum|typedef)\s+(\w+)/g;
        let match;
        
        while ((match = cSymbols.exec(content)) !== null) {
            const symbolName = match[1];
            const lineNum = content.substring(0, match.index).split('\n').length;
            
            if (!this.symbols.has(symbolName)) {
                this.symbols.set(symbolName, []);
            }
            
            this.symbols.get(symbolName).push({
                file: filePath,
                line: lineNum,
                type: 'variable'
            });
        }
        
        // Python symbols (variables, classes)
        const pySymbols = /(?:class)\s+(\w+)/g;
        
        while ((match = pySymbols.exec(content)) !== null) {
            const symbolName = match[1];
            const lineNum = content.substring(0, match.index).split('\n').length;
            
            if (!this.symbols.has(symbolName)) {
                this.symbols.set(symbolName, []);
            }
            
            this.symbols.get(symbolName).push({
                file: filePath,
                line: lineNum,
                type: 'class'
            });
        }
    }

    scanDependencies(filePath, content) {
        const lines = content.split('\n');
        
        // C/C++ includes
        const cIncludes = /#include\s+["<]([^">]+)[">]/g;
        let match;
        
        while ((match = cIncludes.exec(content)) !== null) {
            const includeFile = match[1];
            
            if (!this.dependencies.has(filePath)) {
                this.dependencies.set(filePath, []);
            }
            
            this.dependencies.get(filePath).push({
                type: 'include',
                target: includeFile
            });
        }
        
        // Python imports
        const pyImports = /import\s+([\w.]+)|from\s+([\w.]+)\s+import/g;
        
        while ((match = pyImports.exec(content)) !== null) {
            const importModule = match[1] || match[2];
            
            if (!this.dependencies.has(filePath)) {
                this.dependencies.set(filePath, []);
            }
            
            this.dependencies.get(filePath).push({
                type: 'import',
                target: importModule
            });
        }
    }

    findDefinition() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('没有活动编辑器');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText) {
            vscode.window.showWarningMessage('请选择一个函数名');
            return;
        }

        const definitions = this.functionDefinitions.get(selectedText);
        
        if (!definitions || definitions.length === 0) {
            vscode.window.showInformationMessage(`未找到"${selectedText}"的定义`);
            return;
        }

        if (definitions.length === 1) {
            this.jumpToDefinition(definitions[0]);
        } else {
            this.showDefinitionPicker(definitions, selectedText);
        }
    }

    jumpToDefinition(definition) {
        const uri = vscode.Uri.file(definition.file);
        const position = new vscode.Position(definition.line - 1, 0);
        
        vscode.workspace.openTextDocument(uri).then(doc => {
            vscode.window.showTextDocument(doc).then(editor => {
                const range = new vscode.Range(position, position);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
            });
        });
    }

    showDefinitionPicker(definitions, functionName) {
        const items = definitions.map((def, index) => ({
            label: `${path.basename(def.file)}:${def.line}`,
            description: def.signature,
            detail: def.file,
            index: index
        }));

        vscode.window.showQuickPick(items, {
            placeHolder: `为"${functionName}"找到多个定义`
        }).then(selected => {
            if (selected) {
                this.jumpToDefinition(definitions[selected.index]);
            }
        });
    }

    findUsages() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('没有活动编辑器');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText) {
            vscode.window.showWarningMessage('请选择一个函数名');
            return;
        }

        const calls = this.functionCalls.get(selectedText);
        
        if (!calls || calls.length === 0) {
            vscode.window.showInformationMessage(`未找到"${selectedText}"的使用`);
            return;
        }

        this.showUsagesPicker(calls, selectedText);
    }

    showUsagesPicker(calls, functionName) {
        const items = calls.map((call, index) => ({
            label: `${path.basename(call.file)}:${call.line}`,
            description: `调用${functionName}`,
            detail: call.file,
            index: index
        }));

        vscode.window.showQuickPick(items, {
            placeHolder: `找到${calls.length}个"${functionName}"的使用`
        }).then(selected => {
            if (selected) {
                this.jumpToDefinition(calls[selected.index]);
            }
        });
    }

    showCallHierarchy() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('没有活动编辑器');
            return;
        }

        const selection = editor.selection;
        const selectedText = editor.document.getText(selection);
        
        if (!selectedText) {
            vscode.window.showWarningMessage('请选择一个函数名');
            return;
        }

        const calls = this.functionCalls.get(selectedText);
        
        if (!calls || calls.length === 0) {
            vscode.window.showInformationMessage(`未找到"${selectedText}"的调用层次`);
            return;
        }

        this.showHierarchyPanel(selectedText, calls);
    }

    showHierarchyPanel(functionName, calls) {
        const panel = vscode.window.createWebviewPanel(
            'callHierarchy',
            `调用层次: ${functionName}`,
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        const hierarchyHtml = this.generateHierarchyHtml(functionName, calls);
        panel.webview.html = hierarchyHtml;

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'openFile':
                        this.openFileAtLine(message.file, message.line);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    generateHierarchyHtml(functionName, calls) {
        const callsList = calls.map(call => 
            `<li><a href="#" onclick="openFile('${call.file}', ${call.line})">${path.basename(call.file)}:${call.line}</a></li>`
        ).join('');

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>调用层次</title>
                <style>
                    body {
                        font-family: var(--vscode-font-family);
                        padding: 20px;
                        color: var(--vscode-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    h2 {
                        color: var(--vscode-textLink-foreground);
                        border-bottom: 1px solid var(--vscode-panel-border);
                        padding-bottom: 10px;
                    }
                    ul {
                        list-style-type: none;
                        padding-left: 0;
                    }
                    li {
                        padding: 5px 0;
                        border-bottom: 1px solid var(--vscode-panel-border);
                    }
                    a {
                        color: var(--vscode-textLink-foreground);
                        text-decoration: none;
                    }
                    a:hover {
                        text-decoration: underline;
                    }
                    .function-name {
                        font-weight: bold;
                        color: var(--vscode-textLink-foreground);
                    }
                </style>
            </head>
            <body>
                <h2>调用层次: <span class="function-name">${functionName}</span></h2>
                <p>找到 ${calls.length} 个调用:</p>
                <ul>
                    ${callsList}
                </ul>
                <script>
                    const vscode = acquireVsCodeApi();
                    function openFile(file, line) {
                        vscode.postMessage({
                            command: 'openFile',
                            file: file,
                            line: line
                        });
                    }
                </script>
            </body>
            </html>
        `;
    }

    clearCache() {
        try {
            if (fs.existsSync(this.cacheFile)) {
                fs.unlinkSync(this.cacheFile);
                this.functionDefinitions.clear();
                this.functionCalls.clear();
                this.symbols.clear();
                this.dependencies.clear();
                this.lastScanTime = 0;
                
                vscode.window.showInformationMessage('导航缓存清除成功');
            } else {
                vscode.window.showInformationMessage('没有缓存需要清除');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`清除缓存时出错: ${error.message}`);
        }
    }

    showCodeStructure() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('没有活动编辑器');
            return;
        }

        const filePath = editor.document.uri.fsPath;
        const content = editor.document.getText();
        
        const structure = this.analyzeCodeStructure(filePath, content);
        
        const panel = vscode.window.createWebviewPanel(
            'codeStructure',
            `代码结构: ${path.basename(filePath)}`,
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );

        panel.webview.html = this.generateCodeStructureHtml(structure);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'openFile':
                        this.openFileAtLine(message.file, message.line);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    analyzeCodeStructure(filePath, content) {
        const structure = {
            functions: [],
            classes: [],
            variables: []
        };

        // 分析函数
        const funcPattern = /(\w+)\s*\([^)]*\)\s*\{/g;
        let match;
        while ((match = funcPattern.exec(content)) !== null) {
            const funcName = match[1];
            const lineNum = content.substring(0, match.index).split('\n').length;
            structure.functions.push({ name: funcName, line: lineNum });
        }

        // 分析类
        const classPattern = /class\s+(\w+)/g;
        while ((match = classPattern.exec(content)) !== null) {
            const className = match[1];
            const lineNum = content.substring(0, match.index).split('\n').length;
            structure.classes.push({ name: className, line: lineNum });
        }

        // 分析变量
        const varPattern = /(?:int|float|double|char|bool|void)\s+(\w+)/g;
        while ((match = varPattern.exec(content)) !== null) {
            const varName = match[1];
            const lineNum = content.substring(0, match.index).split('\n').length;
            structure.variables.push({ name: varName, line: lineNum });
        }

        return structure;
    }

    generateCodeStructureHtml(structure) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>代码结构</title>
                <style>
                    body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); background-color: var(--vscode-editor-background); }
                    h2 { color: var(--vscode-textLink-foreground); border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 10px; }
                    h3 { color: var(--vscode-textLink-foreground); margin-top: 20px; }
                    ul { list-style-type: none; padding-left: 0; }
                    li { padding: 5px 0; border-bottom: 1px solid var(--vscode-panel-border); }
                    a { color: var(--vscode-textLink-foreground); text-decoration: none; }
                    a:hover { text-decoration: underline; }
                </style>
            </head>
            <body>
                <h2>代码结构</h2>
                
                <h3>函数</h3>
                <ul>
                    ${structure.functions.length > 0 ? structure.functions.map(func => `<li><a href="#" onclick="openFile('${vscode.window.activeTextEditor.document.uri.fsPath}', ${func.line})"><strong>${func.name}</strong> (行 ${func.line})</a></li>`).join('') : '<li>无函数</li>'}
                </ul>
                
                <h3>类</h3>
                <ul>
                    ${structure.classes.length > 0 ? structure.classes.map(cls => `<li><a href="#" onclick="openFile('${vscode.window.activeTextEditor.document.uri.fsPath}', ${cls.line})"><strong>${cls.name}</strong> (行 ${cls.line})</a></li>`).join('') : '<li>无类</li>'}
                </ul>
                
                <h3>变量</h3>
                <ul>
                    ${structure.variables.length > 0 ? structure.variables.map(var => `<li><a href="#" onclick="openFile('${vscode.window.activeTextEditor.document.uri.fsPath}', ${var.line})"><strong>${var.name}</strong> (行 ${var.line})</a></li>`).join('') : '<li>无变量</li>'}
                </ul>
                
                <script>
                    const vscode = acquireVsCodeApi();
                    function openFile(file, line) {
                        vscode.postMessage({ command: 'openFile', file: file, line: line });
                    }
                </script>
            </body>
            </html>
        `;
    }

    searchSymbols() {
        vscode.window.showInputBox({
            placeHolder: '输入符号名称',
            prompt: '搜索项目中的符号'
        }).then(symbolName => {
            if (!symbolName) return;

            const results = [];
            
            // 搜索函数定义
            if (this.functionDefinitions.has(symbolName)) {
                const definitions = this.functionDefinitions.get(symbolName);
                results.push(...definitions.map(def => ({
                    label: `函数定义: ${symbolName}`,
                    description: `${path.basename(def.file)}:${def.line}`,
                    detail: def.file,
                    type: 'function',
                    file: def.file,
                    line: def.line
                })));
            }
            
            // 搜索符号
            if (this.symbols.has(symbolName)) {
                const symbols = this.symbols.get(symbolName);
                results.push(...symbols.map(sym => ({
                    label: `符号: ${symbolName}`,
                    description: `${path.basename(sym.file)}:${sym.line} (${sym.type})`,
                    detail: sym.file,
                    type: sym.type,
                    file: sym.file,
                    line: sym.line
                })));
            }
            
            if (results.length === 0) {
                vscode.window.showInformationMessage(`未找到符号 "${symbolName}"`);
                return;
            }
            
            vscode.window.showQuickPick(results).then(selected => {
                if (selected) {
                    this.openFileAtLine(selected.file, selected.line);
                }
            });
        });
    }

    showDependencies() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('没有活动编辑器');
            return;
        }

        const filePath = editor.document.uri.fsPath;
        const dependencies = this.dependencies.get(filePath) || [];
        
        if (dependencies.length === 0) {
            vscode.window.showInformationMessage('此文件没有依赖关系');
            return;
        }
        
        const panel = vscode.window.createWebviewPanel(
            'dependencies',
            `依赖分析: ${path.basename(filePath)}`,
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );

        panel.webview.html = this.generateDependenciesHtml(filePath, dependencies);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'openFile':
                        this.openFileAtLine(message.file, message.line);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    generateDependenciesHtml(filePath, dependencies) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>依赖分析</title>
                <style>
                    body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); background-color: var(--vscode-editor-background); }
                    h2 { color: var(--vscode-textLink-foreground); border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 10px; }
                    ul { list-style-type: none; padding-left: 0; }
                    li { padding: 5px 0; border-bottom: 1px solid var(--vscode-panel-border); }
                    .dependency-type { font-weight: bold; color: var(--vscode-textLink-foreground); }
                </style>
            </head>
            <body>
                <h2>依赖分析: ${path.basename(filePath)}</h2>
                <ul>
                    ${dependencies.length > 0 ? dependencies.map(dep => `<li><span class="dependency-type">${dep.type}:</span> ${dep.target}</li>`).join('') : '<li>无依赖关系</li>'}
                </ul>
            </body>
            </html>
        `;
    }

    compareFiles() {
        vscode.window.showOpenDialog({
            canSelectMultiple: true,
            filters: {
                '所有文件': ['*'],
                '源代码文件': ['c', 'cpp', 'h', 'hpp', 'java', 'py', 'js', 'ts']
            }
        }).then(files => {
            if (!files || files.length !== 2) {
                vscode.window.showWarningMessage('请选择两个文件进行比较');
                return;
            }
            
            const file1 = files[0].fsPath;
            const file2 = files[1].fsPath;
            
            vscode.commands.executeCommand('vscode.diff', files[0], files[1]);
        });
    }

    addBookmark() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('没有活动编辑器');
            return;
        }

        const selection = editor.selection;
        const line = selection.active.line + 1;
        const filePath = editor.document.uri.fsPath;
        const fileName = path.basename(filePath);
        
        const bookmark = {
            id: Date.now(),
            file: filePath,
            line: line,
            name: `${fileName}:${line}`,
            timestamp: new Date().toISOString()
        };
        
        this.bookmarks.push(bookmark);
        this.saveBookmarks();
        
        vscode.window.showInformationMessage(`已添加书签: ${bookmark.name}`);
    }

    showBookmarks() {
        if (this.bookmarks.length === 0) {
            vscode.window.showInformationMessage('没有书签');
            return;
        }
        
        const items = this.bookmarks.map(bookmark => ({
            label: bookmark.name,
            description: bookmark.file,
            detail: new Date(bookmark.timestamp).toLocaleString(),
            bookmark: bookmark
        }));
        
        vscode.window.showQuickPick(items).then(selected => {
            if (selected) {
                this.openFileAtLine(selected.bookmark.file, selected.bookmark.line);
            }
        });
    }

    showCodeMetrics() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('没有活动编辑器');
            return;
        }

        const content = editor.document.getText();
        const lines = content.split('\n');
        const functions = (content.match(/\w+\s*\([^)]*\)\s*\{/g) || []).length;
        const classes = (content.match(/class\s+\w+/g) || []).length;
        const variables = (content.match(/(?:int|float|double|char|bool|void)\s+\w+/g) || []).length;
        const imports = (content.match(/#include\s+["<][^">]+[">]/g) || []).length;
        
        const metrics = {
            lines: lines.length,
            functions: functions,
            classes: classes,
            variables: variables,
            imports: imports
        };
        
        const panel = vscode.window.createWebviewPanel(
            'codeMetrics',
            `代码度量: ${path.basename(editor.document.uri.fsPath)}`,
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );

        panel.webview.html = this.generateCodeMetricsHtml(metrics);

        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            message => {
                switch (message.command) {
                    case 'openFile':
                        this.openFileAtLine(message.file, message.line);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    generateCodeMetricsHtml(metrics) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>代码度量</title>
                <style>
                    body { font-family: var(--vscode-font-family); padding: 20px; color: var(--vscode-foreground); background-color: var(--vscode-editor-background); }
                    h2 { color: var(--vscode-textLink-foreground); border-bottom: 1px solid var(--vscode-panel-border); padding-bottom: 10px; }
                    .metric { margin: 10px 0; padding: 10px; border: 1px solid var(--vscode-panel-border); border-radius: 4px; }
                    .metric-label { font-weight: bold; color: var(--vscode-textLink-foreground); }
                </style>
            </head>
            <body>
                <h2>代码度量</h2>
                <div class="metric"><span class="metric-label">行数:</span> ${metrics.lines}</div>
                <div class="metric"><span class="metric-label">函数数:</span> ${metrics.functions}</div>
                <div class="metric"><span class="metric-label">类数:</span> ${metrics.classes}</div>
                <div class="metric"><span class="metric-label">变量数:</span> ${metrics.variables}</div>
                <div class="metric"><span class="metric-label">导入数:</span> ${metrics.imports}</div>
            </body>
            </html>
        `;
    }

    openFileAtLine(filePath, line) {
        vscode.workspace.openTextDocument(filePath).then(doc => {
            vscode.window.showTextDocument(doc).then(editor => {
                const position = new vscode.Position(line - 1, 0);
                editor.selection = new vscode.Selection(position, position);
                editor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.AtTop);
            });
        });
    }
}

module.exports = CodeNavigator;