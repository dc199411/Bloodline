import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { SiweMessage } from 'siwe';
import { redis } from '../lib/redis';
import { prisma } from '../lib/prisma';
import { validate } from '../middleware/validate';
import type { JWTPayload } from '../types';

export const authRouter: Router = Router();

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '24h';
const REFRESH_EXPIRES_IN = process.env.REFRESH_EXPIRES_IN ?? '7d';
const NONCE_TTL_SECONDS = 300;

const nonceSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

const verifySchema = z.object({
  message: z.string(),
  signature: z.string(),
});

const refreshSchema = z.object({
  refreshToken: z.string(),
});

function signAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

function signRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'] });
}

authRouter.post('/nonce', validate(nonceSchema), async (req: Request, res: Response) => {
  try {
    const { address } = req.body as z.infer<typeof nonceSchema>;
    const nonce = randomBytes(16).toString('hex');

    await redis.set(`nonce:${address.toLowerCase()}`, nonce, 'EX', NONCE_TTL_SECONDS);

    res.json({ nonce });
  } catch (err) {
    console.error('[Auth] Nonce generation error:', err);
    res.status(500).json({ error: 'Failed to generate nonce' });
  }
});

authRouter.post('/verify', validate(verifySchema), async (req: Request, res: Response) => {
  try {
    const { message, signature } = req.body as z.infer<typeof verifySchema>;

    const siweMessage = new SiweMessage(message);
    const { data: fields } = await siweMessage.verify({ signature });

    const expectedDomain = process.env.SIWE_DOMAIN;
    if (expectedDomain && fields.domain !== expectedDomain) {
      res.status(401).json({ error: 'Invalid SIWE domain' });
      return;
    }

    const expectedChainId = process.env.CHAIN_ID ? Number(process.env.CHAIN_ID) : undefined;
    if (expectedChainId && fields.chainId !== expectedChainId) {
      res.status(401).json({ error: 'Invalid chain ID' });
      return;
    }

    const storedNonce = await redis.get(`nonce:${fields.address.toLowerCase()}`);
    if (!storedNonce || storedNonce !== fields.nonce) {
      res.status(401).json({ error: 'Invalid or expired nonce' });
      return;
    }

    await redis.del(`nonce:${fields.address.toLowerCase()}`);

    let user = await prisma.user.findUnique({
      where: { walletAddress: fields.address.toLowerCase() },
    });

    if (!user) {
      user = await prisma.user.create({
        data: { walletAddress: fields.address.toLowerCase() },
      });
    } else {
      await prisma.user.update({
        where: { id: user.id },
        data: { lastSeenAt: new Date() },
      });
    }

    const payload: JWTPayload = { sub: user.id, address: user.walletAddress };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await redis.set(
      `refresh:${user.id}`,
      refreshToken,
      'EX',
      7 * 24 * 60 * 60,
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        displayName: user.displayName,
      },
    });
  } catch (err) {
    console.error('[Auth] Verification error:', err);
    res.status(401).json({ error: 'Signature verification failed' });
  }
});

authRouter.post('/refresh', validate(refreshSchema), async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body as z.infer<typeof refreshSchema>;

    let decoded: JWTPayload;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as JWTPayload;
    } catch {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    const storedToken = await redis.get(`refresh:${decoded.sub}`);
    if (!storedToken || storedToken !== refreshToken) {
      res.status(401).json({ error: 'Refresh token revoked or invalid' });
      return;
    }

    const payload: JWTPayload = { sub: decoded.sub, address: decoded.address };
    const newAccessToken = signAccessToken(payload);
    const newRefreshToken = signRefreshToken(payload);

    await redis.set(
      `refresh:${decoded.sub}`,
      newRefreshToken,
      'EX',
      7 * 24 * 60 * 60,
    );

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    console.error('[Auth] Refresh error:', err);
    res.status(500).json({ error: 'Failed to refresh token' });
  }
});
