import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'pitchxi_jwt_super_secret_dev_key_2024';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'pitchxi_refresh_super_secret_dev_key_2024';

const ACCESS_TOKEN_EXPIRY = '1h';
const REFRESH_TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  displayName: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // in seconds (3600)
}

/**
 * Hashes a plain-text password using bcrypt with 10 salt rounds.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares a plain-text candidate password with a stored bcrypt hash.
 */
export async function comparePassword(candidate: string, hash: string): Promise<boolean> {
  return bcrypt.compare(candidate, hash);
}

/**
 * Generates an Access Token and Refresh Token for an authenticated user.
 */
export function generateAuthTokens(payload: TokenPayload): AuthTokens {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY
  });

  const refreshToken = jwt.sign(
    { userId: payload.userId, email: payload.email },
    JWT_REFRESH_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: 3600
  };
}

/**
 * Verifies an Access Token and returns the decoded payload.
 */
export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

/**
 * Verifies a Refresh Token and returns the decoded user identity.
 */
export function verifyRefreshToken(token: string): { userId: string; email: string } {
  return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string; email: string };
}
