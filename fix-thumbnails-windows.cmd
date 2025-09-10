@echo off
setlocal enabledelayedexpansion

echo ========================================
echo   Kobac Real Estate - Fix Thumbnail Duplication
echo   Windows CMD Version
echo ========================================
echo.

REM Check if Node.js is available
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js and try again
    pause
    exit /b 1
)

echo Node.js found: 
node --version
echo.

REM Check if MongoDB connection string is available
if "%MONGODB_URI%"=="" (
    echo WARNING: MONGODB_URI environment variable not set
    echo Make sure your .env.local file has MONGODB_URI configured
    echo.
)

echo Starting thumbnail duplication fix...
echo This will:
echo 1. Connect to your MongoDB database
echo 2. Find properties with duplicate thumbnails in images array
echo 3. Remove the duplicate thumbnails from images array
echo 4. Show statistics of the fix
echo.

set /p confirm="Do you want to continue? (y/N): "
if /i not "%confirm%"=="y" (
    echo Operation cancelled.
    pause
    exit /b 0
)

echo.
echo Running fix script...
echo.

REM Run the Node.js script
node scripts/fix-thumbnail-duplication.js

set script_result=%errorlevel%

echo.
if %script_result% equ 0 (
    echo ========================================
    echo   SUCCESS: Fix completed successfully!
    echo ========================================
    echo.
    echo All properties have been updated to remove
    echo duplicate thumbnails from the images array.
    echo.
    echo You can now view your properties and the
    echo thumbnail gallery should show only additional
    echo images (no duplicate thumbnails).
) else (
    echo ========================================
    echo   ERROR: Fix failed with errors
    echo ========================================
    echo.
    echo Please check the error messages above and
    echo make sure your MongoDB connection is working.
    echo.
    echo Common issues:
    echo - MongoDB connection string not set
    echo - Database not accessible
    echo - Network connectivity issues
)

echo.
echo Press any key to exit...
pause >nul

