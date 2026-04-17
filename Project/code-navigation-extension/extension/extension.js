const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const CodeNavigator = require('./codeNavigator');

function activate(context) {
    console.log('代码导航扩展已激活！');

    const navigator = new CodeNavigator(context);
    
    // Register commands
    const findDefinitionCommand = vscode.commands.registerCommand('codeNavigation.findDefinition', () => {
        navigator.findDefinition();
    });

    const findUsagesCommand = vscode.commands.registerCommand('codeNavigation.findUsages', () => {
        navigator.findUsages();
    });

    const showCallHierarchyCommand = vscode.commands.registerCommand('codeNavigation.showCallHierarchy', () => {
        navigator.showCallHierarchy();
    });

    const scanProjectCommand = vscode.commands.registerCommand('codeNavigation.scanProject', () => {
        navigator.scanProject();
    });

    const clearCacheCommand = vscode.commands.registerCommand('codeNavigation.clearCache', () => {
        navigator.clearCache();
    });

    const showCodeStructureCommand = vscode.commands.registerCommand('codeNavigation.showCodeStructure', () => {
        navigator.showCodeStructure();
    });

    const searchSymbolsCommand = vscode.commands.registerCommand('codeNavigation.searchSymbols', () => {
        navigator.searchSymbols();
    });

    const showDependenciesCommand = vscode.commands.registerCommand('codeNavigation.showDependencies', () => {
        navigator.showDependencies();
    });

    const compareFilesCommand = vscode.commands.registerCommand('codeNavigation.compareFiles', () => {
        navigator.compareFiles();
    });

    const addBookmarkCommand = vscode.commands.registerCommand('codeNavigation.addBookmark', () => {
        navigator.addBookmark();
    });

    const showBookmarksCommand = vscode.commands.registerCommand('codeNavigation.showBookmarks', () => {
        navigator.showBookmarks();
    });

    const showCodeMetricsCommand = vscode.commands.registerCommand('codeNavigation.showCodeMetrics', () => {
        navigator.showCodeMetrics();
    });

    // Add subscriptions
    context.subscriptions.push(findDefinitionCommand);
    context.subscriptions.push(findUsagesCommand);
    context.subscriptions.push(showCallHierarchyCommand);
    context.subscriptions.push(scanProjectCommand);
    context.subscriptions.push(clearCacheCommand);
    context.subscriptions.push(showCodeStructureCommand);
    context.subscriptions.push(searchSymbolsCommand);
    context.subscriptions.push(showDependenciesCommand);
    context.subscriptions.push(compareFilesCommand);
    context.subscriptions.push(addBookmarkCommand);
    context.subscriptions.push(showBookmarksCommand);
    context.subscriptions.push(showCodeMetricsCommand);

    // Initialize navigator
    navigator.initialize();
}

function deactivate() {
    console.log('代码导航扩展已停用！');
}

module.exports = {
    activate,
    deactivate
};