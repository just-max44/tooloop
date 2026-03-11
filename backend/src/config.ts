import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000'),
  NODE_ENV: z.string().default('development'),
  DATABASE_URL: z.string().url(),
  DATABASE_SSL_REJECT_UNAUTHORIZED: z.string().default('false'),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),
  R2_ACCOUNT_ID: z.string().optional(),
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET: z.string().optional(),
  R2_PUBLIC_BASE_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default('*'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid backend environment: ${parsed.error.message}`);
}

export const env = {
  ...parsed.data,
  PORT: Number(parsed.data.PORT),
  R2_PUBLIC_BASE_URL: parsed.data.R2_PUBLIC_BASE_URL ? String(parsed.data.R2_PUBLIC_BASE_URL) : undefined,
};

export function isR2Configured() {
  return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY && env.R2_BUCKET);
}