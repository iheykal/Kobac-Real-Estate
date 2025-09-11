#!/usr/bin/env node

/**
 * Restore Debug Pages Script
 * This script restores the debug pages that were moved during zero-error deploy
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔄 Restoring debug pages...\n');

const backupDir = 'backup-debug-pages';

if (!fs.existsSync(backupDir)) {
  console.log('❌ No backup directory found. Nothing to restore.');
  process.exit(1);
}

const backupFiles = fs.readdirSync(backupDir);

if (backupFiles.length === 0) {
  console.log('❌ No files found in backup directory.');
  process.exit(1);
}

console.log(`📁 Found ${backupFiles.length} files to restore:`);

backupFiles.forEach(file => {
  const backupPath = `${backupDir}/${file}`;
  const originalPath = `src/app/${file}`;
  
  try {
    execSync(`mv "${backupPath}" "${originalPath}"`, { stdio: 'inherit' });
    console.log(`  ✅ Restored ${file}`);
  } catch (error) {
    console.log(`  ❌ Failed to restore ${file}: ${error.message}`);
  }
});

console.log('\n🎉 Debug pages restored successfully!');
console.log('💡 You can now run: npm run build (to test locally)');
console.log('🚀 Or commit and push to deploy with debug pages');
