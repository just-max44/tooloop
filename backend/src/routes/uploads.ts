import { randomUUID } from 'node:crypto';

import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { type Response, Router } from 'express';
import { z } from 'zod';

import { env, isR2Configured } from '../config.js';
import { authRequired, type AuthenticatedRequest } from '../middleware/auth.js';

const bodySchema = z.object({
  contentType: z.string().trim().min(1),
  extension: z.string().trim().min(1).max(10).default('jpg'),
});

const MAX_UPLOAD_SIZE = 10 * 1024 * 1024; // 10 MB

const uploadsRouter = Router();

const r2Client = isR2Configured()
  ? new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    })
  : null;

uploadsRouter.post('/presign', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  if (!r2Client || !env.R2_BUCKET) {
    res.status(503).json({ error: 'R2 not configured' });
    return;
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const ext = parsed.data.extension.replace('.', '').toLowerCase();
  const objectKey = `${req.user!.userId}/${Date.now()}-${randomUUID()}.${ext}`;

  const putCommand = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: objectKey,
    ContentType: parsed.data.contentType,
    ContentLength: MAX_UPLOAD_SIZE,
  });

  const uploadUrl = await getSignedUrl(r2Client, putCommand, { expiresIn: 300 });

  const getCommand = new GetObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: objectKey,
  });

  const publicBaseUrl = typeof env.R2_PUBLIC_BASE_URL === 'string' ? env.R2_PUBLIC_BASE_URL : '';
  const downloadUrl = publicBaseUrl
    ? `${publicBaseUrl.replace(/\/$/, '')}/${objectKey}`
    : await getSignedUrl(r2Client, getCommand, { expiresIn: 3600 });

  res.json({
    key: objectKey,
    uploadUrl,
    publicUrl: downloadUrl,
  });
});

export { uploadsRouter };