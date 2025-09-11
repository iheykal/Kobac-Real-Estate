#!/usr/bin/env node

/**
 * Zero Error Deploy Script for Render
 * This script removes problematic files and creates a clean deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting ZERO ERROR Deploy to Render...\n');

// Step 1: Backup problematic files
console.log('📦 Step 1: Backing up problematic files...');
const problematicFiles = [
  'src/app/debug-superadmin-access',
  'src/app/debug-auth',
  'src/app/debug-auth-admin',
  'src/app/debug-auth-issue',
  'src/app/debug-auth-status',
  'src/app/debug-cookies',
  'src/app/debug-image-duplication',
  'src/app/debug-properties',
  'src/app/debug-properties-display',
  'src/app/debug-property-images',
  'src/app/debug-r2-config',
  'src/app/debug-r2-env',
  'src/app/debug-r2-images',
  'src/app/debug-session',
  'src/app/debug-session-simple',
  'src/app/debug-signup',
  'src/app/debug-view-counts',
  'src/app/test-admin',
  'src/app/test-agent',
  'src/app/test-agent-upload',
  'src/app/test-auth',
  'src/app/test-auth-api',
  'src/app/test-avatar',
  'src/app/test-avatar-debug',
  'src/app/test-avatar-system',
  'src/app/test-create-kobac',
  'src/app/test-different-colors',
  'src/app/test-fix-avatars',
  'src/app/test-hybrid-avatars',
  'src/app/test-image-constructor',
  'src/app/test-image-error',
  'src/app/test-logo-display',
  'src/app/test-pie-colors',
  'src/app/test-promote-kobac',
  'src/app/test-property-creation-r2',
  'src/app/test-property-display',
  'src/app/test-property-fix',
  'src/app/test-r2-images',
  'src/app/test-r2-upload',
  'src/app/test-real-images',
  'src/app/test-server',
  'src/app/test-simple',
  'src/app/test-update-kobac',
  'src/app/test-upload-debug',
  'src/app/test-views',
  'src/app/test-webp-conversion',
  'src/app/check-property-images',
  'src/app/fix-r2-domain'
];

// Create backup directory
if (!fs.existsSync('backup-debug-pages')) {
  fs.mkdirSync('backup-debug-pages');
}

// Move problematic files to backup
problematicFiles.forEach(file => {
  if (fs.existsSync(file)) {
    const backupPath = `backup-debug-pages/${path.basename(file)}`;
    try {
      execSync(`mv "${file}" "${backupPath}"`, { stdio: 'inherit' });
      console.log(`  ✅ Moved ${file} to backup`);
    } catch (error) {
      console.log(`  ⚠️  Could not move ${file}: ${error.message}`);
    }
  }
});

console.log('  ✅ Backup completed\n');

// Step 2: Clean everything
console.log('🧹 Step 2: Cleaning everything...');
try {
  if (fs.existsSync('node_modules')) {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  }
  if (fs.existsSync('package-lock.json')) {
    execSync('rm -f package-lock.json', { stdio: 'inherit' });
  }
  if (fs.existsSync('.next')) {
    execSync('rm -rf .next', { stdio: 'inherit' });
  }
  console.log('  ✅ Cleanup completed\n');
} catch (error) {
  console.log('  ⚠️  Cleanup had issues (this is usually fine):', error.message);
}

// Step 3: Install dependencies
console.log('📥 Step 3: Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('  ✅ Dependencies installed\n');
} catch (error) {
  console.log('  ❌ Dependency installation failed:', error.message);
  process.exit(1);
}

// Step 4: Build the application
console.log('🔨 Step 4: Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('  ✅ Build completed successfully!\n');
} catch (error) {
  console.log('  ❌ Build failed:', error.message);
  console.log('  🔄 Restoring backup files...');
  
  // Restore backup files
  problematicFiles.forEach(file => {
    const backupPath = `backup-debug-pages/${path.basename(file)}`;
    if (fs.existsSync(backupPath)) {
      try {
        execSync(`mv "${backupPath}" "${file}"`, { stdio: 'inherit' });
        console.log(`  ✅ Restored ${file}`);
      } catch (restoreError) {
        console.log(`  ⚠️  Could not restore ${file}: ${restoreError.message}`);
      }
    }
  });
  
  process.exit(1);
}

// Step 5: Git operations
console.log('📝 Step 5: Preparing for deployment...');
try {
  execSync('git add .', { stdio: 'inherit' });
  execSync(`git commit -m "Zero error deploy: ${new Date().toISOString()}"`, { stdio: 'inherit' });
  console.log('  ✅ Changes committed\n');
} catch (error) {
  console.log('  ⚠️  Git operations had issues:', error.message);
}

// Step 6: Push to trigger deployment
console.log('🚀 Step 6: Pushing to trigger Render deployment...');
try {
  execSync('git push origin main', { stdio: 'inherit' });
  console.log('  ✅ Push completed - Render should start deploying\n');
} catch (error) {
  console.log('  ❌ Push failed:', error.message);
  process.exit(1);
}

console.log('🎉 ZERO ERROR deploy process completed!');
console.log('📊 Check your Render dashboard for deployment status');
console.log('🔗 Your app will be available at: https://kobac-real-estate.onrender.com');
console.log('\n💡 Debug pages are backed up in backup-debug-pages/ folder');
console.log('🔄 To restore them later, run: node restore-debug-pages.js');
