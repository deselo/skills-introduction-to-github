#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Code Navigation Extension - Build Script');
console.log('=========================================\n');

// Check if vsce is installed
try {
    execSync('vsce --version', { stdio: 'pipe' });
    console.log('✓ vsce is installed\n');
} catch (error) {
    console.log('✗ vsce is not installed');
    console.log('Installing vsce...\n');
    execSync('npm install -g @vscode/vsce', { stdio: 'inherit' });
}

// Install dependencies
console.log('Installing dependencies...');
try {
    execSync('npm install', { stdio: 'inherit' });
    console.log('✓ Dependencies installed\n');
} catch (error) {
    console.error('✗ Failed to install dependencies:', error.message);
    process.exit(1);
}

// Package the extension
console.log('Packaging extension...');
try {
    execSync('npm run package', { stdio: 'inherit' });
    console.log('\n✓ Extension packaged successfully!');
    
    // List the generated files
    const files = fs.readdirSync('.').filter(file => file.endsWith('.vsix'));
    if (files.length > 0) {
        console.log('\nGenerated files:');
        files.forEach(file => {
            const stats = fs.statSync(file);
            console.log(`  - ${file} (${(stats.size / 1024).toFixed(2)} KB)`);
        });
    }
    
    console.log('\nTo install the extension:');
    console.log('1. Open Visual Studio Code');
    console.log('2. Go to Extensions (Ctrl+Shift+X)');
    console.log('3. Click the ... menu and select "Install from VSIX..."');
    console.log(`4. Select the generated .vsix file`);
    
} catch (error) {
    console.error('\n✗ Failed to package extension:', error.message);
    process.exit(1);
}