import { passwordMinLength, type User } from '@mono/contracts';
import { compare, hash } from 'bcryptjs';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AppOptions } from '../config.js';
import { findUserByEmail, findUserById, insertUser, type Database } from '../db.js';
import { HttpError, parseBody } from '../http.js';
import { clearSession, requireUserId, signSession, writeSession } from '../session.js';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const credentials = z.object({
  email: z
    .string({ error: 'This field is required.' })
    .trim()
    .min(1, { error: 'This field is required.' })
    .max(254, { error: 'Enter a valid email address.' })
    .toLowerCase()
    .regex(emailPattern, { error: 'Enter a valid email address.' }),
  password: z
    .string({ error: 'This field is required.' })
    .min(passwordMinLength, { error: `Use at least ${passwordMinLength} characters.` })
    .max(72, { error: 'Use at most 72 characters.' }),
});

const loginFailure = 'Email or password is incorrect.';

export function registerAuth(app: FastifyInstance, db: Database, options: AppOptions): void {
  app.get('/api/health', async () => ({ ok: true as const }));

  app.post('/api/auth/register', async (request, reply) => {
    const body = parseBody(credentials, request.body);
    if (findUserByEmail(db, body.email) !== undefined) {
      throw new HttpError(409, 'An account with this email already exists.');
    }
    const passwordHash = await hash(body.password, options.passwordRounds);
    let user;
    try {
      user = insertUser(db, body.email, passwordHash);
    } catch (error) {
      if (error instanceof Error && error.message.includes('UNIQUE constraint failed')) {
        throw new HttpError(409, 'An account with this email already exists.');
      }
      throw error;
    }
    writeSession(reply, await signSession(user.id, options.authSecret), options.secureCookie);
    return reply.code(201).send(publicUser(user));
  });

  app.post('/api/auth/login', async (request, reply) => {
    const body = parseBody(credentials, request.body);
    const user = findUserByEmail(db, body.email);
    const passwordHash = user?.passwordHash ?? (await dummyHash(options.passwordRounds));
    const matches = await compare(body.password, passwordHash);
    if (user === undefined || !matches) throw new HttpError(401, loginFailure);
    writeSession(reply, await signSession(user.id, options.authSecret), options.secureCookie);
    return reply.send(publicUser(user));
  });

  app.post('/api/auth/logout', async (_request, reply) => {
    clearSession(reply, options.secureCookie);
    return reply.code(204).send();
  });

  app.get('/api/auth/me', async (request) => {
    const userId = await requireUserId(request, options.authSecret);
    const user = findUserById(db, userId);
    if (user === undefined) throw new HttpError(401, 'Sign in to continue.');
    return publicUser(user);
  });
}

function publicUser(user: { id: string; email: string }): User {
  return { id: user.id, email: user.email };
}

let dummyPasswordHash: Promise<string> | undefined;

function dummyHash(rounds: number): Promise<string> {
  dummyPasswordHash ??= hash('not-a-password', rounds);
  return dummyPasswordHash;
}
