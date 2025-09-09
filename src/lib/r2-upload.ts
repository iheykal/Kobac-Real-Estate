'use client';

// NOTE: client-only helper that calls your server routes.
// DO NOT import '@aws-sdk/*' or 'crypto' here.

export async function uploadToR2(file: File, listingId?: string): Promise<{ key: string; url: string }> {
  try {
    const formData = new FormData();
    formData.append('files', file);
    if (listingId) formData.append('listingId', listingId);

    const res = await fetch('/api/r2/upload', { method: 'POST', body: formData });
    const { success, files, error } = await res.json();

    if (error) throw new Error(error);
    if (!success || !files?.length) throw new Error('Upload failed - no files returned');

    const uploadedFile = files[0];
    return { key: uploadedFile.key, url: uploadedFile.url };
  } catch (error) {
    // fallback to local storage
    try {
      const formData = new FormData();
      formData.append('files', file);
      if (listingId) formData.append('listingId', listingId);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Local upload failed with status ${res.status}: ${await res.text()}`);

      const data = await res.json();
      const { success, files, error } = data;
      if (error) throw new Error(error);
      if (!success || !files?.length) throw new Error('Local upload failed - no files returned');

      const uploadedFile = files[0];
      return { key: uploadedFile.key, url: uploadedFile.url };
    } catch (localError: any) {
      throw new Error(
        `Both R2 and local upload failed. R2 error: ${
          error instanceof Error ? error.message : 'Unknown'
        }, Local error: ${localError instanceof Error ? localError.message : 'Unknown'}`
      );
    }
  }
}

export async function uploadAgentAvatarToR2(file: File, agentId: string): Promise<{ key: string; url: string }> {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('agentId', agentId);

    const res = await fetch('/api/upload-avatar', { method: 'POST', body: formData });
    const { success, key, url, error } = await res.json();

    if (error) throw new Error(error);
    if (!success) throw new Error('Avatar upload failed');

    return { key, url };
  } catch (error) {
    // fallback to local storage
    try {
      const formData = new FormData();
      formData.append('files', file);
      formData.append('folder', 'agents');
      formData.append('agentId', agentId);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error(`Local upload failed with status ${res.status}: ${await res.text()}`);

      const data = await res.json();
      const { success, files, error } = data;
      if (error) throw new Error(error);
      if (!success || !files?.length) throw new Error('Agent avatar local upload failed - no files returned');

      const uploadedFile = files[0];
      return { key: uploadedFile.key, url: uploadedFile.url };
    } catch (localError: any) {
      throw new Error(
        `Both R2 and local upload failed for agent avatar. R2 error: ${
          error instanceof Error ? error.message : 'Unknown'
        }, Local error: ${localError instanceof Error ? localError.message : 'Unknown'}`
      );
    }
  }
}

export async function uploadMultipleToR2(files: File[], listingId?: string): Promise<{ key: string; url: string }[]> {
  return Promise.all(files.map((f) => uploadToR2(f, listingId)));
}