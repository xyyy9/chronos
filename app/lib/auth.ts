import 'server-only';

import { cache } from 'react';
import { cookies } from 'next/headers';
import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { prisma } from '@/app/lib/prisma';

const scrypt = promisify(_scrypt);

const SESSION_COOKIE_NAME = 'chronos_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

const LEGACY_EMAIL = 'xycindyz@gmail.com';
const LEGACY_PASSWORD = '111111';

export type SessionUser = {
  id: string;
  email: string;
  username: string;
};

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt.toString('hex')}:${derivedKey.toString('hex')}`;
};

export const verifyPassword = async (password: string, storedHash: string) => {
  const [saltHex, hashHex] = storedHash.split(':');
  if (!saltHex || !hashHex) {
    return false;
  }
  const salt = Buffer.from(saltHex, 'hex');
  const targetHash = Buffer.from(hashHex, 'hex');
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  if (derivedKey.length !== targetHash.length) {
    return false;
  }
  return timingSafeEqual(derivedKey, targetHash);
};

let legacyInit: Promise<void> | null = null;

const ensureLegacyUser = async () => {
  if (!legacyInit) {
    legacyInit = (async () => {
      const existingUser = await prisma.user.findUnique({
        where: { email: LEGACY_EMAIL },
      });

      let user = existingUser;

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: LEGACY_EMAIL,
            username: LEGACY_EMAIL.split('@')[0] ?? 'chronos-user',
            passwordHash: await hashPassword(LEGACY_PASSWORD),
          },
        });
      }

      await prisma.dailyLog.updateMany({
        where: { userId: null },
        data: { userId: user.id },
      });
    })().catch((error) => {
      console.error('legacy-user-init-failed', error);
    });
  }

  await legacyInit;
};

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  await ensureLegacyUser();

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const hashedToken = hashToken(token);

  const session = await prisma.session.findUnique({
    where: { token: hashedToken },
    include: {
      user: true,
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.session.delete({ where: { id: session.id } });
    }
    cookieStore.delete(SESSION_COOKIE_NAME);
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    username: session.user.username,
  };
});

export const createSession = async (userId: string) => {
  const cookieStore = await cookies();
  const token = randomBytes(48).toString('hex');
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      token: hashedToken,
      userId,
      expiresAt,
    },
  });

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    path: '/',
  });
};

export const destroySession = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return;
  }
  const hashedToken = hashToken(token);

  await prisma.session.deleteMany({
    where: {
      token: hashedToken,
    },
  });

  cookieStore.delete(SESSION_COOKIE_NAME);
};

export const requireUser = async (): Promise<SessionUser> => {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('UNAUTHENTICATED');
  }
  return user;
};
