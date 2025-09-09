'use client';

// NOTE: client-only helper that calls your server routes.
// DO NOT import '@aws-sdk/*' or 'crypto' here.

export async function uploadToR2(file: File, listingId?: string): Promise<{ key: string; url: string }> {
  const formData = new FormData();
  formData.append('files', file);
  if (listingId) formData.append('listingId', listingId);

  const res = await fetch('/api/r2/upload', { method: 'POST', body: formData });
  const { success, files, error } = await res.json();

  if (error) throw new Error(error);
  if (!success || !files?.length) throw new Error('R2 upload failed - no files returned');

  const uploadedFile = files[0];
  return { key: uploadedFile.key, url: uploadedFile.url };
}

export async function uploadAgentAvatarToR2(file: File, agentId: string): Promise<{ key: string; url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('agentId', agentId);

  const res = await fetch('/api/upload-avatar', { method: 'POST', body: formData });
  const { success, key, url, error } = await res.json();

  if (error) throw new Error(error);
  if (!success) throw new Error('R2 avatar upload failed');

  return { key, url };
}

export async function uploadMultipleToR2(files: File[], listingId?: string): Promise<{ key: string; url: string }[]> {
  return Promise.all(files.map((f) => uploadToR2(f, listingId)));
}