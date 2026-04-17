# Code Navigation Extension - Build and Installation Guide

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)
- Visual Studio Code (1.60.0 or higher)

## Building the Extension

### Step 1: Install Dependencies

Navigate to the extension directory and install the required dependencies:

```bash
cd code-navigation-extension
npm install
```

### Step 2: Package the Extension

Use the `vsce` tool to package the extension into a `.vsix` file:

```bash
npm run package
```

This will create a `code-navigation-extension-1.0.0.vsix` file in the current directory.

## Installation

### Method 1: Install from VSIX File

1. Open Visual Studio Code
2. Go to the Extensions view (Ctrl+Shift+X)
3. Click the `...` menu in the top right corner
4. Select `Install from VSIX...`
5. Navigate to and select the `code-navigation-extension-1.0.0.vsix` file
6. Click `Install`

### Method 2: Install from Source

1. Open the extension folder in Visual Studio Code
2. Press `F5` to launch a new VS Code window with the extension loaded
3. The extension will be available in the new window

## Usage

After installation, the extension provides the following features:

### Commands

- **Find Function Definition** (`F12`): Jump to the definition of the selected function
- **Find Function Usages** (`Shift+F12`): Find all usages of the selected function
- **Show Call Hierarchy** (`Ctrl+Shift+H`): Display the call hierarchy for the selected function
- **Scan Project for Navigation**: Manually trigger a project scan
- **Clear Navigation Cache**: Clear the cached navigation data

### Context Menu

Right-click on a selected function name in the editor to access navigation commands.

## Configuration

The extension automatically scans the project on first activation and caches the results. You can manually trigger a rescan using the `Scan Project for Navigation` command.

## Troubleshooting

### Extension Not Working

1. Check the VS Code Output panel for error messages
2. Try clearing the cache and rescanning the project
3. Ensure you have the required file types in your project

### Performance Issues

1. Clear the navigation cache
2. Rescan the project
3. Consider excluding large directories from the scan

## Development

### Running in Development Mode

1. Open the extension folder in VS Code
2. Press `F5` to launch a new VS Code window with the extension loaded
3. Make changes to the source files
4. Reload the window to see changes

### Debugging

1. Open the extension folder in VS Code
2. Set breakpoints in the source files
3. Press `F5` to launch the extension in debug mode
4. Use the Developer Tools to inspect the extension

## Support

For issues, questions, or contributions, please visit the project repository.

## License

This extension is released under the MIT License.