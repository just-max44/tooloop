import { type Request, type Response, Router } from 'express';

import { dbHealthcheck } from '../db.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const dbOk = await dbHealthcheck().catch(() => false);
  res.status(dbOk ? 200 : 503).json({ ok: dbOk });
});