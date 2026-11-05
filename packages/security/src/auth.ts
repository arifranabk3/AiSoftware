import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { createHash } from 'node:crypto';

// --- ARGON2ID PASSWORD HASHING ---

export async function hashPassword(plainText: string): Promise<string> {
  if (!plainText || plainText.length < 8) {
    throw new Error('Password must be at least 8 characters long');
  }
  const hash = await argon2.hash(plainText, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  });
  return String(hash);
}

export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plainText);
  } catch {
    return false;
  }
}

// --- JWT SESSION TOKENS ---

export interface TokenPayload {
  userId: string;
  email: string;
  isOwner: boolean;
  role: string;
}

export interface GeneratedTokens {
  accessToken: string;
  refreshToken: string;
  refreshTokenHash: string;
  accessTokenExpiresIn: string;
}

export function generateAuthTokens(
  payload: TokenPayload,
  jwtSecret: string,
  refreshSecret: string,
  accessExpiresIn = '15m'
): GeneratedTokens {
  const accessToken = jwt.sign(payload, jwtSecret, {
    expiresIn: accessExpiresIn as jwt.SignOptions['expiresIn']
  });
  const refreshToken = jwt.sign({ userId: payload.userId }, refreshSecret, { expiresIn: '7d' });

  // Refresh token hash stored in state/DB to enable secure comparison and revocation
  const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');

  return {
    accessToken,
    refreshToken,
    refreshTokenHash,
    accessTokenExpiresIn: accessExpiresIn
  };
}

export function verifyAccessToken(token: string, jwtSecret: string): TokenPayload {
  return jwt.verify(token, jwtSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string, refreshSecret: string): { userId: string } {
  return jwt.verify(token, refreshSecret) as { userId: string };
}
