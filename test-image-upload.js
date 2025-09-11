// Test image upload functionality
const fs = require('fs');
const path = require('path');

// Test Sharp import
async function testSharpImport() {
  try {
    console.log('🔄 Testing Sharp import...');
    const { getSharp } = require('./src/lib/dynamicImports');
    const sharp = await getSharp();
    
    if (!sharp || typeof sharp !== 'function') {
      throw new Error('Sharp library not properly imported');
    }
    
    console.log('✅ Sharp import successful');
    return true;
  } catch (error) {
    console.error('❌ Sharp import failed:', error.message);
    return false;
  }
}

// Test image processing
async function testImageProcessing() {
  try {
    console.log('🔄 Testing image processing...');
    const { processImageFileSafe } = require('./src/lib/imageProcessor');
    
    // Create a simple test buffer (1x1 pixel PNG)
    const testBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, // bit depth, color type, etc.
      0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
      0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00, // compressed data
      0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00, // more data
      0x01, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, // IEND chunk
      0x44, 0xAE, 0x42, 0x60, 0x82
    ]);
    
    // Create a mock File object
    const mockFile = {
      name: 'test.png',
      type: 'image/png',
      arrayBuffer: async () => testBuffer
    };
    
    const result = await processImageFileSafe(mockFile, {
      quality: 85,
      width: 100,
      height: 100,
      fit: 'inside'
    });
    
    console.log('✅ Image processing successful:', {
      filename: result.filename,
      contentType: result.contentType,
      bufferLength: result.buffer.length
    });
    
    return true;
  } catch (error) {
    console.error('❌ Image processing failed:', error.message);
    return false;
  }
}

// Test environment variables
function testEnvironmentVariables() {
  console.log('🔄 Testing environment variables...');
  
  const requiredVars = [
    'R2_ENDPOINT',
    'R2_ACCESS_KEY_ID', 
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET'
  ];
  
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing environment variables:', missing);
    console.log('💡 To fix: Set these variables in Render dashboard under Environment tab');
    return false;
  }
  
  console.log('✅ All required environment variables are set');
  return true;
}

// Run all tests
async function runTests() {
  console.log('🧪 Running image upload tests...\n');
  
  const results = {
    sharpImport: await testSharpImport(),
    imageProcessing: await testImageProcessing(),
    environmentVars: testEnvironmentVariables()
  };
  
  console.log('\n📊 Test Results:');
  console.log(`Sharp Import: ${results.sharpImport ? '✅' : '❌'}`);
  console.log(`Image Processing: ${results.imageProcessing ? '✅' : '❌'}`);
  console.log(`Environment Variables: ${results.environmentVars ? '✅' : '❌'}`);
  
  const allPassed = Object.values(results).every(result => result);
  
  if (allPassed) {
    console.log('\n🎉 All tests passed! Image upload should work correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the issues above.');
  }
  
  process.exit(allPassed ? 0 : 1);
}

runTests();
