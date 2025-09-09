import { getSharp } from './dynamicImports';

export interface ImageProcessingOptions {
  quality?: number;
  width?: number;
  height?: number;
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
  // New options for better error handling
  validateOutput?: boolean;
  fallbackToOriginal?: boolean;
}

/**
 * Converts an image buffer to WebP format with optional resizing
 * Enhanced with better error handling and validation
 */
export async function convertToWebP(
  buffer: Buffer, 
  options: ImageProcessingOptions = {}
): Promise<{ buffer: Buffer; filename: string }> {
  const sharp = await getSharp();
  const {
    quality = 85, // Increased default quality from 80 to 85
    width,
    height,
    fit = 'cover',
    validateOutput = true, // New: validate output by default
    fallbackToOriginal = false // New: fallback option
  } = options;

  try {
    // Validate input buffer
    if (!buffer || buffer.length === 0) {
      throw new Error('Invalid input buffer: buffer is empty or null');
    }

    let sharpInstance = sharp(buffer);
    
    // Get metadata for validation
    const metadata = await sharpInstance.metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error('Invalid image metadata: missing width or height');
    }

    // Resize if dimensions are provided
    if (width || height) {
      sharpInstance = sharpInstance.resize(width, height, { fit });
    }

    // Convert to WebP with enhanced settings
    const webpBuffer = await sharpInstance
      .webp({ 
        quality,
        effort: 6, // Higher effort for better compression
        lossless: false,
        smartSubsample: true // Better quality for photos
      })
      .toBuffer();

    // Validate output buffer if requested
    if (validateOutput) {
      if (webpBuffer.length === 0) {
        throw new Error('WebP conversion produced empty buffer');
      }
      
      // Verify the output is a valid WebP
      try {
        const outputMetadata = await sharp(webpBuffer).metadata();
        if (!outputMetadata.format || !outputMetadata.format.includes('webp')) {
          throw new Error('Output is not a valid WebP format');
        }
      } catch (validationError) {
        console.warn('WebP validation failed:', validationError);
        if (!fallbackToOriginal) {
          throw new Error('WebP validation failed and fallback is disabled');
        }
        // Fallback to original buffer with original extension
        const originalExt = metadata.format || 'jpg';
        const timestamp = Date.now();
        const uuid = Math.random().toString(36).substring(2, 15);
        const filename = `${timestamp}-${uuid}.${originalExt}`;
        
        return {
          buffer: buffer, // Return original buffer
          filename
        };
      }
    }

    // Generate new filename with .webp extension
    const timestamp = Date.now();
    const uuid = Math.random().toString(36).substring(2, 15);
    const filename = `${timestamp}-${uuid}.webp`;

    return {
      buffer: webpBuffer,
      filename
    };
  } catch (error) {
    console.error('Error converting image to WebP:', error);
    
    // If fallback is enabled and we have a valid original buffer, return it
    if (fallbackToOriginal && buffer && buffer.length > 0) {
      console.warn('Falling back to original image format due to WebP conversion error');
      const timestamp = Date.now();
      const uuid = Math.random().toString(36).substring(2, 15);
      const filename = `${timestamp}-${uuid}.jpg`; // Default to jpg for fallback
      
      return {
        buffer: buffer,
        filename
      };
    }
    
    throw new Error(`Failed to convert image to WebP: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Processes an image file and converts it to WebP
 */
export async function processImageFile(
  file: File, 
  options: ImageProcessingOptions = {}
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not an image');
    }

    // Convert to WebP
    const { buffer: webpBuffer, filename } = await convertToWebP(buffer, options);

    return {
      buffer: webpBuffer,
      filename,
      contentType: 'image/webp'
    };
  } catch (error) {
    console.error('Error processing image file:', error);
    throw error;
  }
}

/**
 * Processes multiple image files and converts them to WebP
 */
export async function processMultipleImages(
  files: File[], 
  options: ImageProcessingOptions = {}
): Promise<Array<{ buffer: Buffer; filename: string; contentType: string }>> {
  const processedImages = await Promise.all(
    files.map(file => processImageFile(file, options))
  );
  
  return processedImages;
}

/**
 * Safe image processing with fallback - prevents corruption by falling back to original format
 * This is the recommended function for production use
 */
export async function processImageFileSafe(
  file: File, 
  options: ImageProcessingOptions = {}
): Promise<{ buffer: Buffer; filename: string; contentType: string }> {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      throw new Error('File is not an image');
    }

    // Try WebP conversion with fallback enabled
    const { buffer: processedBuffer, filename } = await convertToWebP(buffer, {
      ...options,
      fallbackToOriginal: true, // Enable fallback for safety
      validateOutput: true
    });

    // Determine content type based on filename
    const contentType = filename.endsWith('.webp') ? 'image/webp' : file.type;

    return {
      buffer: processedBuffer,
      filename,
      contentType
    };
  } catch (error) {
    console.error('Error processing image file safely:', error);
    throw error;
  }
}

/**
 * Safe processing for multiple images with fallback
 */
export async function processMultipleImagesSafe(
  files: File[], 
  options: ImageProcessingOptions = {}
): Promise<Array<{ buffer: Buffer; filename: string; contentType: string }>> {
  const processedImages = await Promise.all(
    files.map(file => processImageFileSafe(file, options))
  );
  
  return processedImages;
}
