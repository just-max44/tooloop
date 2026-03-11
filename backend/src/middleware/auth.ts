import type { NextFunction, Request, Response } from 'express';

import { verifyAccessToken } from '../auth.js';

export type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    email: string;
  };
};

export function authRequired(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.header('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';

  if (!token) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const decoded = verifyAccessToken(token);
    req.user = {
      userId: decoded.sub,
      email: decoded.email,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}