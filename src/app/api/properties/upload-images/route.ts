import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/sessionUtils';
import { isAllowed } from '@/lib/authz/authorize';
import { processImageFileSafe } from '@/lib/imageProcessor';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    console.log('📸 Property image upload request received');
    
    // Get session for authorization
    const session = getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    // Check authorization for creating properties
    const authResult = isAllowed({
      sessionUserId: session.userId,
      role: session.role,
      action: 'create',
      resource: 'property',
      ownerId: session.userId
    });
    
    if (!authResult.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Forbidden: insufficient permissions' 
      }, { status: 403 });
    }
    
    const form = await req.formData();
    const files = form.getAll('files') as File[];
    const listingId = form.get('listingId') as string;

    if (!files.length) {
      return NextResponse.json({ success: false, error: 'No files provided' }, { status: 400 });
    }

    console.log(`📸 Uploading ${files.length} files to R2 for listing: ${listingId || 'general'}`);
    console.log('📸 Files to upload:', files.map(f => f instanceof File ? { name: f.name, size: f.size, type: f.type } : { name: 'unknown', size: 0, type: 'unknown' }));

    // dynamic import to keep bundle small
    const [{ S3Client, PutObjectCommand }] = await Promise.all([
      import('@aws-sdk/client-s3'),
    ]);

    const s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
      maxAttempts: 3,
    });

    const bucket = process.env.R2_BUCKET!;
    const publicBase = process.env.R2_PUBLIC_BASE_URL || '';

    const results: Array<{ key: string; url: string }> = [];

    for (const f of files) {
      if (!(f instanceof File)) continue;
      
      // Type assertion since we've confirmed it's a File
      const file = f as File;
      console.log(`🔄 Processing property image: ${file.name} (${file.type})`);
      
      let processedFile: { buffer: Buffer; filename: string; contentType: string };
      
      // Check if it's an image file
      if (file.type.startsWith('image/')) {
        console.log('📸 Converting property image to WebP format...');
        try {
          processedFile = await processImageFileSafe(file, {
            quality: 85, // Good balance of quality and file size for property images
            width: 1920, // Max width for web display
            height: 1080, // Max height for web display
            fit: 'inside' // Maintain aspect ratio
          });
          console.log(`✅ WebP conversion successful: ${processedFile.filename}`);
        } catch (error) {
          console.error('❌ WebP conversion failed, using original:', error);
          // Fallback to original file
          const bytes = await file.arrayBuffer();
          processedFile = {
            buffer: Buffer.from(bytes),
            filename: sanitizeName(file.name),
            contentType: file.type || 'application/octet-stream'
          };
        }
      } else {
        // For non-image files, use original
        console.log('📄 Non-image file, using original format');
        const bytes = await file.arrayBuffer();
        processedFile = {
          buffer: Buffer.from(bytes),
          filename: sanitizeName(file.name),
          contentType: file.type || 'application/octet-stream'
        };
      }
      
      // Create organized directory structure: kobac-real-estate/uploads/listings/{listingId}/
      const baseDir = listingId ? `kobac-real-estate/uploads/listings/${listingId}` : 'kobac-real-estate/uploads';
      const timestamp = Date.now();
      const randomId = cryptoRandom(8);
      const key = `${baseDir}/${timestamp}-${randomId}-${processedFile.filename}`;

      const cmd = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: processedFile.buffer,
        ContentType: processedFile.contentType,
      });

      await s3.send(cmd);

      // Generate correct R2 public URL format: https://bucket-name.r2.dev/key
      const url = publicBase
        ? `${publicBase.replace(/\/$/, '')}/${key}`
        : `https://${bucket}.r2.dev/${key}`;

      results.push({ key, url });
      
      console.log(`✅ Uploaded: ${key} -> ${url}`);
      console.log(`🔍 URL Debug:`, {
        publicBase: publicBase,
        r2Endpoint: process.env.R2_ENDPOINT,
        bucket: bucket,
        key: key,
        finalUrl: url,
        urlFormat: 'https://bucket-name.r2.dev/key'
      });
    }

    console.log(`🎉 Successfully uploaded ${results.length} files to R2 with WebP conversion`);
    console.log('📸 Final upload results:', results.map(r => ({ key: r.key, url: r.url })));

    return NextResponse.json({ 
      success: true, 
      files: results,
      message: `Successfully uploaded ${results.length} images to Cloudflare R2 with WebP optimization`
    });
    
  } catch (err: any) {
    console.error('❌ Property image upload error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// Helper functions
function sanitizeName(name: string) {
  return name.replace(/[^\w.\-]+/g, '_');
}

function cryptoRandom(len: number) {
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const arr = new Uint8Array(len);
    globalThis.crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } else {
    const nodeCrypto = require('crypto') as typeof import('crypto');
    return nodeCrypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len * 2);
  }
}

