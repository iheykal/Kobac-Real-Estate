@echo off
echo 🚀 Starting ZERO ERROR Deploy to Render...
echo.

echo 📦 Step 1: Backing up problematic files...
if not exist backup-debug-pages mkdir backup-debug-pages

REM Move all debug and test pages to backup
for /d %%i in (src\app\debug-* src\app\test-* src\app\check-* src\app\fix-*) do (
    if exist "%%i" (
        move "%%i" "backup-debug-pages\%%~ni" >nul 2>&1
        if errorlevel 1 (
            echo   ⚠️  Could not move %%~ni
        ) else (
            echo   ✅ Moved %%~ni to backup
        )
    )
)

echo   ✅ Backup completed
echo.

echo 🧹 Step 2: Cleaning everything...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist .next rmdir /s /q .next
echo   ✅ Cleanup completed
echo.

echo 📥 Step 3: Installing dependencies...
call npm install
if errorlevel 1 (
    echo   ❌ Dependency installation failed
    pause
    exit /b 1
)
echo   ✅ Dependencies installed
echo.

echo 🔨 Step 4: Building application...
call npm run build
if errorlevel 1 (
    echo   ❌ Build failed - restoring backup files...
    
    REM Restore backup files
    for /d %%i in (backup-debug-pages\*) do (
        if exist "%%i" (
            move "%%i" "src\app\%%~ni" >nul 2>&1
            if errorlevel 1 (
                echo   ⚠️  Could not restore %%~ni
            ) else (
                echo   ✅ Restored %%~ni
            )
        )
    )
    
    pause
    exit /b 1
)
echo   ✅ Build completed successfully!
echo.

echo 📝 Step 5: Preparing for deployment...
git add .
git commit -m "Zero error deploy: %date% %time%"
if errorlevel 1 (
    echo   ⚠️  Git commit had issues
)
echo   ✅ Changes committed
echo.

echo 🚀 Step 6: Pushing to trigger Render deployment...
git push origin main
if errorlevel 1 (
    echo   ❌ Push failed
    pause
    exit /b 1
)
echo   ✅ Push completed - Render should start deploying
echo.

echo 🎉 ZERO ERROR deploy process completed!
echo 📊 Check your Render dashboard for deployment status
echo 🔗 Your app will be available at: https://kobac-real-estate.onrender.com
echo.
echo 💡 Debug pages are backed up in backup-debug-pages\ folder
echo 🔄 To restore them later, run: restore-debug-pages.bat
pause
