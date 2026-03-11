import { type Request, type Response, Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import {
    comparePassword,
    compareToken,
    hashPassword,
    hashToken,
    signAccessToken,
    signRefreshToken,
    verifyRefreshToken,
} from '../auth.js';
import { db } from '../db.js';
import { authRequired, type AuthenticatedRequest } from '../middleware/auth.js';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().trim().min(1).default('Utilisateur'),
  lastName: z.string().trim().min(1).default('Tooloop'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

const privateLocationSchema = z.object({
  city: z.string().trim().min(1),
  postalCode: z.string().trim().min(1),
});

const profilePhotoSchema = z.object({
  photoUri: z.string().trim().min(1),
});

function computeRefreshExpiry(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

async function issueSessionTokens(userId: string, email: string) {
  const payload = { sub: userId, email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  const refreshTokenHash = await hashToken(refreshToken);

  await db.query('insert into refresh_tokens (user_id, token_hash, expires_at) values ($1, $2, $3)', [
    userId,
    refreshTokenHash,
    computeRefreshExpiry(),
  ]);

  return { accessToken, refreshToken };
}

export const authRouter = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives, r\u00e9essayez dans 15 minutes.' },
});

authRouter.post('/register', authLimiter, async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const { email, password, firstName, lastName } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const existing = await db.query('select id from users where email = $1', [normalizedEmail]);
  if (existing.rowCount) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }

  const passwordHash = await hashPassword(password);

  const insertResult = await db.query(
    `
      insert into users (email, password_hash, first_name, last_name)
      values ($1, $2, $3, $4)
      returning id, email, first_name, last_name, avatar_url
    `,
    [normalizedEmail, passwordHash, firstName, lastName]
  );

  const user = insertResult.rows[0] as {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
  };

  const tokens = await issueSessionTokens(user.id, user.email);

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
    },
    ...tokens,
  });
});

authRouter.post('/login', authLimiter, async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  const result = await db.query(
    `
      select id, email, password_hash, first_name, last_name, avatar_url, private_city, private_postal_code
      from users
      where email = $1
      limit 1
    `,
    [normalizedEmail]
  );

  if (!result.rowCount) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const user = result.rows[0] as {
    id: string;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    private_city: string | null;
    private_postal_code: string | null;
  };

  const isValid = await comparePassword(password, user.password_hash);
  if (!isValid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const tokens = await issueSessionTokens(user.id, user.email);

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      privateCity: user.private_city,
      privatePostalCode: user.private_postal_code,
    },
    ...tokens,
  });
});

authRouter.post('/refresh', async (req: Request, res: Response) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const { refreshToken } = parsed.data;

  let decoded: { sub: string; email: string };
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
    return;
  }

  const tokensResult = await db.query(
    'select id, token_hash from refresh_tokens where user_id = $1 and expires_at > now() order by created_at desc',
    [decoded.sub]
  );

  const matchingToken = await Promise.all(
    tokensResult.rows.map(async (row: { id: string; token_hash: string }) => ({
      id: row.id as string,
      isMatch: await compareToken(refreshToken, row.token_hash as string),
    }))
  ).then((items: Array<{ id: string; isMatch: boolean }>) => items.find((item) => item.isMatch));

  if (!matchingToken) {
    res.status(401).json({ error: 'Refresh token revoked' });
    return;
  }

  await db.query('delete from refresh_tokens where id = $1', [matchingToken.id]);
  const tokens = await issueSessionTokens(decoded.sub, decoded.email);
  res.json(tokens);
});

authRouter.post('/logout', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  await db.query('delete from refresh_tokens where user_id = $1', [req.user!.userId]);
  res.status(204).send();
});

authRouter.get('/me', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const result = await db.query(
    `
      select id, email, first_name, last_name, avatar_url, private_city, private_postal_code
      from users
      where id = $1
      limit 1
    `,
    [req.user!.userId]
  );

  if (!result.rowCount) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const user = result.rows[0] as {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    private_city: string | null;
    private_postal_code: string | null;
  };

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      avatarUrl: user.avatar_url,
      privateCity: user.private_city,
      privatePostalCode: user.private_postal_code,
    },
  });
});

authRouter.patch('/me/private-location', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = privateLocationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const { city, postalCode } = parsed.data;
  await db.query(
    `
      update users
      set private_city = $1,
          private_postal_code = $2,
          updated_at = now()
      where id = $3
    `,
    [city, postalCode, req.user!.userId]
  );

  res.status(204).send();
});

authRouter.patch('/me/avatar', authRequired, async (req: AuthenticatedRequest, res: Response) => {
  const parsed = profilePhotoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  await db.query(
    `
      update users
      set avatar_url = $1,
          updated_at = now()
      where id = $2
    `,
    [parsed.data.photoUri, req.user!.userId]
  );

  res.status(204).send();
});