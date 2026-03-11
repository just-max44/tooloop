import { Pool } from 'pg';

import { env } from './config.js';

export const db = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
  },
});

export async function dbHealthcheck() {
  const result = await db.query('select 1 as ok');
  return result.rows[0]?.ok === 1;
}