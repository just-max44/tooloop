import { apiRequest } from '@/lib/backend/custom-api';

type PresignResponse = {
  key: string;
  uploadUrl: string;
  publicUrl: string;
};

function inferExtensionFromContentType(contentType: string) {
  if (contentType.includes('png')) {
    return 'png';
  }
  if (contentType.includes('webp')) {
    return 'webp';
  }
  return 'jpg';
}

export async function uploadFileToR2(fileUri: string, contentType = 'image/jpeg') {
  const extension = inferExtensionFromContentType(contentType);
  const presign = await apiRequest<PresignResponse>('/v1/uploads/presign', {
    method: 'POST',
    body: JSON.stringify({ contentType, extension }),
  });

  const fileResponse = await fetch(fileUri);
  const fileBlob = await fileResponse.blob();

  const uploadResponse = await fetch(presign.uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: fileBlob,
  });

  if (!uploadResponse.ok) {
    throw new Error(`Upload R2 échoué (${uploadResponse.status}).`);
  }

  return {
    key: presign.key,
    publicUrl: presign.publicUrl,
  };
}