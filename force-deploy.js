#!/usr/bin/env node

/**
 * Force Deployment Script
 * Aggressively optimizes the app for Vercel deployment
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting force deployment optimization...');

// 1. Remove large files and directories
const filesToRemove = [
  'public/uploads',
  'temp-backup',
  'scripts',
  'src/__tests__',
  'jest.config.js',
  'jest.setup.js',
  'convert-to-webp.js',
  'promote-kobac.js',
  'promote-kobac.mjs',
  'test-build.js'
];

filesToRemove.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      if (fs.statSync(file).isDirectory()) {
        fs.rmSync(file, { recursive: true, force: true });
        console.log(`✅ Removed directory: ${file}`);
      } else {
        fs.unlinkSync(file);
        console.log(`✅ Removed file: ${file}`);
      }
    }
  } catch (error) {
    console.log(`⚠️  Could not remove ${file}: ${error.message}`);
  }
});

// 2. Create minimal .vercelignore
const vercelIgnoreContent = `
# Remove everything that's not essential
node_modules/
.next/
out/
build/
dist/
coverage/
.nyc_output/
__tests__/
*.test.*
*.spec.*
*.md
docs/
.vscode/
.idea/
*.swp
*.swo
.DS_Store
Thumbs.db
*.log
logs/
tmp/
temp/
.tmp/
backup/
*.backup
public/uploads/
public/icons/*.gif
public/icons/*.mp4
src/__tests__/
scripts/
convert-to-webp.js
promote-kobac.js
promote-kobac.mjs
test-build.js
jest.config.js
jest.setup.js
`;

fs.writeFileSync('.vercelignore', vercelIgnoreContent);
console.log('✅ Updated .vercelignore');

// 3. Force install and build
try {
  console.log('📦 Installing dependencies...');
  execSync('npm install --production --no-optional', { stdio: 'inherit' });
  
  console.log('🔨 Building application...');
  execSync('npm run build', { stdio: 'inherit' });
  
  console.log('🚀 Deploying to Vercel...');
  execSync('vercel --prod --force', { stdio: 'inherit' });
  
  console.log('✅ Force deployment completed successfully!');
} catch (error) {
  console.error('❌ Force deployment failed:', error.message);
  process.exit(1);
}
