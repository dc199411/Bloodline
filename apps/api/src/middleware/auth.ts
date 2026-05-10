import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { AuthRequest, JWTPayload } from '../types';

function getJWTSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return secret;
}

export function extractToken(req: AuthRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJWTSecret(), {
      algorithms: ['HS256'],
    }) as JWTPayload & { typ?: string };
    if (decoded.typ === 'refresh') return null;
    return decoded;
  } catch {
    return null;
  }
}

export function authRequired(req: Request, res: Response, next: NextFunction): void {
  const authReq = req as AuthRequest;
  const token = extractToken(authReq);
  if (!token) {
    res.status(401).json({ error: 'Missing or invalid authorization header' });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }

  authReq.user = payload;
  next();
}
