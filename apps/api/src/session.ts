import type { FastifyReply, FastifyRequest } from 'fastify';
import { SignJWT, jwtVerify } from 'jose';
import '@fastify/cookie';
import { HttpError } from './http.js';

const cookieName = 'session';
const maxAgeSeconds = 60 * 60 * 24 * 7;

export async function signSession(userId: string, authSecret: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key(authSecret));
}

export async function readUserId(request: FastifyRequest, authSecret: string): Promise<string | null> {
  const token = request.cookies[cookieName];
  if (token === undefined || token === '') return null;
  try {
    const { payload } = await jwtVerify(token, key(authSecret));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

export async function requireUserId(request: FastifyRequest, authSecret: string): Promise<string> {
  const userId = await readUserId(request, authSecret);
  if (userId === null) throw new HttpError(401, 'Sign in to continue.');
  return userId;
}

export function writeSession(reply: FastifyReply, token: string, secureCookie: boolean): void {
  reply.setCookie(cookieName, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookie,
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export function clearSession(reply: FastifyReply, secureCookie: boolean): void {
  reply.clearCookie(cookieName, {
    httpOnly: true,
    sameSite: 'lax',
    secure: secureCookie,
    path: '/',
  });
}

function key(authSecret: string): Uint8Array {
  return new TextEncoder().encode(authSecret);
}
