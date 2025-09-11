#!/usr/bin/env node

/**
 * Force Deploy Script for Render
 * This script helps force deploy to Render by handling common issues
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting Force Deploy to Render...\n');

// Step 1: Clean and prepare
console.log('📦 Step 1: Cleaning and preparing...');
try {
  // Remove node_modules and package-lock.json for clean install
  if (fs.existsSync('node_modules')) {
    console.log('  - Removing node_modules...');
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  }
  
  if (fs.existsSync('package-lock.json')) {
    console.log('  - Removing package-lock.json...');
    execSync('rm -f package-lock.json', { stdio: 'inherit' });
  }
  
  console.log('  ✅ Cleanup completed\n');
} catch (error) {
  console.log('  ⚠️  Cleanup had issues (this is usually fine):', error.message);
}

// Step 2: Install dependencies
console.log('📥 Step 2: Installing dependencies...');
try {
  execSync('npm install', { stdio: 'inherit' });
  console.log('  ✅ Dependencies installed\n');
} catch (error) {
  console.log('  ❌ Dependency installation failed:', error.message);
  process.exit(1);
}

// Step 3: Build the application
console.log('🔨 Step 3: Building application...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('  ✅ Build completed\n');
} catch (error) {
  console.log('  ❌ Build failed:', error.message);
  process.exit(1);
}

// Step 4: Check for common issues
console.log('🔍 Step 4: Checking for common issues...');

// Check if .next directory exists
if (!fs.existsSync('.next')) {
  console.log('  ❌ .next directory not found - build failed');
  process.exit(1);
}

// Check if standalone output exists
if (!fs.existsSync('.next/standalone')) {
  console.log('  ⚠️  Standalone output not found - this may cause issues on Render');
}

console.log('  ✅ Build verification passed\n');

// Step 5: Git operations
console.log('📝 Step 5: Preparing for deployment...');
try {
  // Add all files
  execSync('git add .', { stdio: 'inherit' });
  
  // Commit with timestamp
  const timestamp = new Date().toISOString();
  execSync(`git commit -m "Force deploy: ${timestamp}"`, { stdio: 'inherit' });
  
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
  console.log('  💡 Try running: git push origin main --force');
  process.exit(1);
}

console.log('🎉 Force deploy process completed!');
console.log('📊 Check your Render dashboard for deployment status');
console.log('🔗 Your app will be available at: https://kobac-real-estate.onrender.com');
console.log('\n💡 If deployment still fails, check the Render logs for specific errors');