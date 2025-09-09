// Node runtime is required for AWS SDK
export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const files = form.getAll('files');

    if (!files.length) {
      return Response.json({ success: false, error: 'No files provided' }, { status: 400 });
    }

    // dynamic import to keep bundle small
    const [{ S3Client, PutObjectCommand }] = await Promise.all([
      import('@aws-sdk/client-s3'),
    ]);

    const s3 = new S3Client({
      region: 'auto',
      endpoint: process.env.R2_ENDPOINT!, // e.g. https://<accountid>.r2.cloudflarestorage.com
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
      maxAttempts: 3,
    });

    const bucket = process.env.R2_BUCKET!;
    const publicBase = process.env.R2_PUBLIC_BASE_URL || ''; // e.g. https://cdn.example.com or https://<bucket>.<accountid>.r2.dev

    const results: Array<{ key: string; url: string }> = [];

    for (const f of files) {
      if (!(f instanceof File)) continue;
      const bytes = await f.arrayBuffer();
      const key = `uploads/${Date.now()}-${cryptoRandom(8)}-${sanitizeName(f.name)}`;

      const cmd = new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: Buffer.from(bytes),
        ContentType: f.type || 'application/octet-stream',
      });

      await s3.send(cmd);

      const url = publicBase
        ? `${publicBase.replace(/\/$/, '')}/${key}`
        : `${process.env.R2_ENDPOINT!.replace(/^https?:\/\/|\/$/g, '')}/${bucket}/${key}`;

      results.push({ key, url });
    }

    return Response.json({ success: true, files: results });
  } catch (err: any) {
    return Response.json(
      { success: false, error: err?.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

// tiny helpers (stay here: server-only)
function sanitizeName(name: string) {
  return name.replace(/[^\w.\-]+/g, '_');
}

function cryptoRandom(len: number) {
  // avoid importing 'crypto' globally; use globalThis.crypto if available, otherwise node:crypto
  if (typeof globalThis.crypto?.getRandomValues === 'function') {
    const arr = new Uint8Array(len);
    globalThis.crypto.getRandomValues(arr);
    return Array.from(arr)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } else {
    // Node fallback
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('crypto') as typeof import('crypto');
    return nodeCrypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len * 2);
  }
}