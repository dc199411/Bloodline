import type { Request } from 'express';

export * from '@bloodline/shared';

export interface JWTPayload {
  sub: string;
  address: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}
