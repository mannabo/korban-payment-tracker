@echo off
echo.
echo ========================================
echo   🚀 KORBAN TRACKER - AUTO DEPLOY
echo ========================================
echo.

REM Check if we have uncommitted changes
git status --porcelain > temp_status.txt
set /p changes=<temp_status.txt
del temp_status.txt

if "%changes%"=="" (
    echo ❌ No changes detected. Nothing to deploy.
    echo.
    pause
    exit /b 1
)

echo 📝 Changes detected! Preparing deployment...
echo.

REM Get commit message from user
set /p commit_message="💬 Enter commit message (or press Enter for default): "
if "%commit_message%"=="" set commit_message=🚀 Auto deploy - %date% %time%

echo.
echo 🔄 Starting deployment process...
echo.

REM Add all changes
echo ➕ Adding all files...
git add .
if errorlevel 1 (
    echo ❌ Failed to add files
    pause
    exit /b 1
)

REM Commit changes
echo 📦 Committing changes...
git commit -m "%commit_message%"
if errorlevel 1 (
    echo ❌ Failed to commit changes
    pause
    exit /b 1
)

REM Push to GitHub
echo 🌐 Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ Failed to push to GitHub
    pause
    exit /b 1
)

echo.
echo ✅ SUCCESS! Deployment initiated
echo.
echo 🔗 Check progress at: https://github.com/mannabo/korban-payment-tracker/actions
echo 🌐 Live site will update automatically via GitHub Actions
echo.
echo ⏳ Deployment typically takes 2-3 minutes...
echo.

REM Option to open GitHub Actions
set /p open_actions="🔍 Open GitHub Actions in browser? (y/n): "
if /i "%open_actions%"=="y" (
    start https://github.com/mannabo/korban-payment-tracker/actions
)

echo.
echo 🎉 Deploy script completed!
echo Your changes are being deployed automatically.
echo.
pause