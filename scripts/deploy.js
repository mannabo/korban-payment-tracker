#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

// Colors for console output
const colors = {
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    reset: '\x1b[0m'
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function colorLog(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, errorMessage) {
    try {
        execSync(command, { stdio: 'inherit' });
        return true;
    } catch (error) {
        colorLog('red', `❌ ${errorMessage}`);
        return false;
    }
}

async function askQuestion(question) {
    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            resolve(answer);
        });
    });
}

async function main() {
    console.clear();
    colorLog('cyan', '========================================');
    colorLog('cyan', '   🚀 KORBAN TRACKER - SMART DEPLOY');
    colorLog('cyan', '========================================');
    console.log();

    // Check for uncommitted changes
    try {
        const status = execSync('git status --porcelain', { encoding: 'utf8' });
        if (!status.trim()) {
            colorLog('red', '❌ No changes detected. Nothing to deploy.');
            process.exit(1);
        }
    } catch (error) {
        colorLog('red', '❌ Git error. Make sure you\'re in a git repository.');
        process.exit(1);
    }

    colorLog('yellow', '📝 Changes detected! Preparing deployment...');
    console.log();

    // Get deployment type
    colorLog('blue', 'Select deployment type:');
    console.log('1. 🚀 Production (main branch)');
    console.log('2. 🧪 Staging (staging branch)');
    console.log('3. ⚡ Quick deploy (with default message)');
    console.log();

    const deployType = await askQuestion('Choose option (1-3): ');
    console.log();

    let commitMessage = '';
    let targetBranch = 'main';

    switch (deployType) {
        case '1':
            commitMessage = await askQuestion('💬 Enter commit message (or press Enter for default): ');
            if (!commitMessage.trim()) {
                commitMessage = `🚀 Production deploy - ${new Date().toLocaleString()}`;
            }
            targetBranch = 'main';
            break;

        case '2':
            commitMessage = await askQuestion('💬 Enter commit message (or press Enter for default): ');
            if (!commitMessage.trim()) {
                commitMessage = `🧪 Staging deploy - ${new Date().toLocaleString()}`;
            }
            targetBranch = 'staging';
            break;

        case '3':
            commitMessage = `⚡ Quick deploy - ${new Date().toLocaleString()}`;
            targetBranch = 'main';
            break;

        default:
            colorLog('red', '❌ Invalid option selected.');
            process.exit(1);
    }

    console.log();
    colorLog('blue', '🔄 Starting deployment process...');
    console.log();

    // Step 1: Add all files
    colorLog('yellow', '➕ Adding all files...');
    if (!execCommand('git add .', 'Failed to add files')) {
        process.exit(1);
    }

    // Step 2: Commit changes
    colorLog('yellow', '📦 Committing changes...');
    if (!execCommand(`git commit -m "${commitMessage}"`, 'Failed to commit changes')) {
        process.exit(1);
    }

    // Step 3: Push to GitHub
    colorLog('yellow', `🌐 Pushing to GitHub (${targetBranch} branch)...`);
    if (!execCommand(`git push origin ${targetBranch}`, 'Failed to push to GitHub')) {
        process.exit(1);
    }

    console.log();
    colorLog('green', '✅ SUCCESS! Deployment initiated');
    console.log();
    
    if (targetBranch === 'main') {
        colorLog('magenta', '🔗 Check progress at: https://github.com/mannabo/korban-payment-tracker/actions');
        colorLog('cyan', '🌐 Live site will update automatically via GitHub Actions');
    } else {
        colorLog('magenta', '🔗 Staging deployment: https://github.com/mannabo/korban-payment-tracker/actions');
        colorLog('cyan', '🧪 Staging site will be updated');
    }
    
    console.log();
    colorLog('yellow', '⏳ Deployment typically takes 2-3 minutes...');
    console.log();

    const openBrowser = await askQuestion('🔍 Open GitHub Actions in browser? (y/n): ');
    if (openBrowser.toLowerCase() === 'y' || openBrowser.toLowerCase() === 'yes') {
        const { execSync } = require('child_process');
        const url = 'https://github.com/mannabo/korban-payment-tracker/actions';
        
        try {
            // Cross-platform browser opening
            const platform = process.platform;
            if (platform === 'darwin') {
                execSync(`open ${url}`);
            } else if (platform === 'win32') {
                execSync(`start ${url}`);
            } else {
                execSync(`xdg-open ${url}`);
            }
        } catch (error) {
            colorLog('yellow', `🔗 Please visit: ${url}`);
        }
    }

    console.log();
    colorLog('green', '🎉 Deploy script completed!');
    colorLog('cyan', 'Your changes are being deployed automatically.');
    console.log();

    rl.close();
}

main().catch((error) => {
    colorLog('red', `❌ An error occurred: ${error.message}`);
    process.exit(1);
});