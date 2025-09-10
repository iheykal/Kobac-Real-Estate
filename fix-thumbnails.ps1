# Kobac Real Estate - Fix Thumbnail Duplication
# PowerShell Version

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Kobac Real Estate - Fix Thumbnail Duplication" -ForegroundColor Cyan
Write-Host "  PowerShell Version" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
try {
    $nodeVersion = node --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green
    } else {
        throw "Node.js not found"
    }
} catch {
    Write-Host "ERROR: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js and try again" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""

# Check if MongoDB connection string is available
if (-not $env:MONGODB_URI) {
    Write-Host "WARNING: MONGODB_URI environment variable not set" -ForegroundColor Yellow
    Write-Host "Make sure your .env.local file has MONGODB_URI configured" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Starting thumbnail duplication fix..." -ForegroundColor Yellow
Write-Host "This will:" -ForegroundColor White
Write-Host "1. Connect to your MongoDB database" -ForegroundColor White
Write-Host "2. Find properties with duplicate thumbnails in images array" -ForegroundColor White
Write-Host "3. Remove the duplicate thumbnails from images array" -ForegroundColor White
Write-Host "4. Show statistics of the fix" -ForegroundColor White
Write-Host ""

$confirm = Read-Host "Do you want to continue? (y/N)"
if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Operation cancelled." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 0
}

Write-Host ""
Write-Host "Running fix script..." -ForegroundColor Yellow
Write-Host ""

# Run the Node.js script
try {
    node scripts/fix-thumbnail-duplication.js
    $scriptResult = $LASTEXITCODE
    
    Write-Host ""
    if ($scriptResult -eq 0) {
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  SUCCESS: Fix completed successfully!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        Write-Host "All properties have been updated to remove" -ForegroundColor White
        Write-Host "duplicate thumbnails from the images array." -ForegroundColor White
        Write-Host ""
        Write-Host "You can now view your properties and the" -ForegroundColor White
        Write-Host "thumbnail gallery should show only additional" -ForegroundColor White
        Write-Host "images (no duplicate thumbnails)." -ForegroundColor White
    } else {
        Write-Host "========================================" -ForegroundColor Red
        Write-Host "  ERROR: Fix failed with errors" -ForegroundColor Red
        Write-Host "========================================" -ForegroundColor Red
        Write-Host ""
        Write-Host "Please check the error messages above and" -ForegroundColor White
        Write-Host "make sure your MongoDB connection is working." -ForegroundColor White
        Write-Host ""
        Write-Host "Common issues:" -ForegroundColor Yellow
        Write-Host "- MongoDB connection string not set" -ForegroundColor White
        Write-Host "- Database not accessible" -ForegroundColor White
        Write-Host "- Network connectivity issues" -ForegroundColor White
    }
} catch {
    Write-Host "ERROR: Failed to run the fix script" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"

