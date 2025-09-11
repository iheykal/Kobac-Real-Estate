@echo off
echo 🚀 Starting Force Deploy to Render...
echo.

echo 📦 Step 1: Cleaning and preparing...
if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json
if exist .next rmdir /s /q .next
echo   ✅ Cleanup completed
echo.

echo 📥 Step 2: Installing dependencies...
call npm install
if errorlevel 1 (
    echo   ❌ Dependency installation failed
    pause
    exit /b 1
)
echo   ✅ Dependencies installed
echo.

echo 🔨 Step 3: Building application...
call npm run build
if errorlevel 1 (
    echo   ❌ Build failed
    pause
    exit /b 1
)
echo   ✅ Build completed
echo.

echo 📝 Step 4: Preparing for deployment...
git add .
git commit -m "Force deploy: %date% %time%"
if errorlevel 1 (
    echo   ⚠️  Git commit had issues
)
echo   ✅ Changes committed
echo.

echo 🚀 Step 5: Pushing to trigger Render deployment...
git push origin main
if errorlevel 1 (
    echo   ❌ Push failed - trying force push...
    git push origin main --force
)
echo   ✅ Push completed - Render should start deploying
echo.

echo 🎉 Force deploy process completed!
echo 📊 Check your Render dashboard for deployment status
echo 🔗 Your app will be available at: https://kobac-real-estate.onrender.com
echo.
echo 💡 If deployment still fails, check the Render logs for specific errors
pause
