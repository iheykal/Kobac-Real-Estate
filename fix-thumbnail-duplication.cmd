@echo off
echo ========================================
echo   Kobac Real Estate - Fix Thumbnail Duplication
echo ========================================
echo.

echo Starting thumbnail duplication fix...
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

echo Node.js found. Running fix script...
echo.

REM Run the Node.js script to fix thumbnail duplication
node scripts/fix-thumbnail-duplication.js

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   Fix completed successfully!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo   Fix failed with errors
    echo ========================================
)

echo.
echo Press any key to exit...
pause >nul

