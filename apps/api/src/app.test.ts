import type { FastifyInstance, LightMyRequestResponse } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';
import type { Todo, User } from '@mono/contracts';
import { buildApp } from './app.js';
import { readConfig } from './config.js';

const authSecret = 'test-secret-test-secret-test-secret';

async function createApp(secureCookie = false): Promise<FastifyInstance> {
  return buildApp({
    databasePath: ':memory:',
    authSecret,
    secureCookie,
    passwordRounds: 4,
    logger: false,
  });
}

function setCookieHeader(response: LightMyRequestResponse): string {
  const value = response.headers['set-cookie'];
  return Array.isArray(value) ? value.join('\n') : String(value ?? '');
}

function sessionHeader(response: LightMyRequestResponse): { cookie: string } {
  const match = setCookieHeader(response).match(/session=([^;]+)/);
  expect(match?.[1]).toBeTruthy();
  return { cookie: `session=${match?.[1]}` };
}

describe('api', () => {
  let app: FastifyInstance | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  it('requires a long AUTH_SECRET', () => {
    expect(() => readConfig({})).toThrow('AUTH_SECRET must be at least 32 characters.');
    const config = readConfig({
      AUTH_SECRET: authSecret,
      PORT: '3001',
      DATABASE_PATH: 'data/app.db',
      NODE_ENV: 'production',
    });
    expect(config).toMatchObject({
      port: 3001,
      databasePath: 'data/app.db',
      secureCookie: true,
      passwordRounds: 10,
    });
  });

  it('reports health', async () => {
    app = await createApp();
    const response = await app.inject({ method: 'GET', url: '/api/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });

  it('registers a user and sets an httpOnly session cookie', async () => {
    app = await createApp();
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: ' Ada@Example.com ', password: 'password1' },
    });
    expect(response.statusCode).toBe(201);
    const user = response.json<User>();
    expect(user).toEqual({ id: expect.any(String), email: 'ada@example.com' });
    expect(response.json()).not.toHaveProperty('password');

    const header = setCookieHeader(response);
    expect(header).toContain('HttpOnly');
    expect(header).toContain('Path=/');
    expect(header).toContain('SameSite=Lax');
    expect(header).toContain('Max-Age=604800');
    expect(header).not.toContain('Secure');

    const me = await app.inject({ method: 'GET', url: '/api/auth/me', headers: sessionHeader(response) });
    expect(me.statusCode).toBe(200);
    expect(me.json()).toEqual(user);
  });

  it('marks the session cookie Secure in production', async () => {
    app = await createApp(true);
    const response = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'ada@example.com', password: 'password1' },
    });
    expect(setCookieHeader(response)).toContain('Secure');
  });

  it('rejects invalid registration', async () => {
    app = await createApp();
    const missing = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { password: 'password1' },
    });
    expect(missing.statusCode).toBe(400);
    expect(missing.json()).toEqual({ message: 'This field is required.' });

    const email = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'not-an-email', password: 'password1' },
    });
    expect(email.statusCode).toBe(400);
    expect(email.json()).toEqual({ message: 'Enter a valid email address.' });

    const password = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'ada@example.com', password: 'short' },
    });
    expect(password.statusCode).toBe(400);
    expect(password.json()).toEqual({ message: 'Use at least 8 characters.' });
  });

  it('rejects a duplicate email', async () => {
    app = await createApp();
    const first = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'ada@example.com', password: 'password1' },
    });
    expect(first.statusCode).toBe(201);
    const second = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'ada@example.com', password: 'password2' },
    });
    expect(second.statusCode).toBe(409);
    expect(second.json()).toEqual({ message: 'An account with this email already exists.' });
  });

  it('logs in with one message for an unknown email and a wrong password', async () => {
    app = await createApp();
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'ada@example.com', password: 'password1' },
    });

    const unknown = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'missing@example.com', password: 'password1' },
    });
    const wrong = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'ada@example.com', password: 'wrong-password' },
    });
    expect(unknown.statusCode).toBe(401);
    expect(wrong.statusCode).toBe(401);
    expect(unknown.json()).toEqual({ message: 'Email or password is incorrect.' });
    expect(wrong.json()).toEqual(unknown.json());

    const loggedIn = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: 'ada@example.com', password: 'password1' },
    });
    expect(loggedIn.statusCode).toBe(200);
    expect(loggedIn.json()).toMatchObject({ email: 'ada@example.com' });
    const me = await app.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: sessionHeader(loggedIn),
    });
    expect(me.statusCode).toBe(200);
  });

  it('clears the session cookie on logout', async () => {
    app = await createApp();
    const registered = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'ada@example.com', password: 'password1' },
    });
    const loggedOut = await app.inject({
      method: 'POST',
      url: '/api/auth/logout',
      headers: sessionHeader(registered),
    });
    expect(loggedOut.statusCode).toBe(204);
    const header = setCookieHeader(loggedOut).toLowerCase();
    expect(header).toContain('session=');
    expect(header).toContain('expires=thu, 01 jan 1970');

    const me = await app.inject({ method: 'GET', url: '/api/auth/me' });
    expect(me.statusCode).toBe(401);
    expect(me.json()).toEqual({ message: 'Sign in to continue.' });
  });

  it('creates, updates, and deletes only the signed-in user todos', async () => {
    app = await createApp();
    const ada = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'ada@example.com', password: 'password1' },
    });
    const adaCookie = sessionHeader(ada);

    const denied = await app.inject({ method: 'GET', url: '/api/todos' });
    expect(denied.statusCode).toBe(401);

    const emptyTitle = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: adaCookie,
      payload: { title: '   ' },
    });
    expect(emptyTitle.statusCode).toBe(400);
    expect(emptyTitle.json()).toEqual({ message: 'Enter a title.' });

    const emptyPatch = await app.inject({
      method: 'PATCH',
      url: '/api/todos/missing',
      headers: adaCookie,
      payload: {},
    });
    expect(emptyPatch.statusCode).toBe(400);
    expect(emptyPatch.json()).toEqual({ message: 'Nothing to update.' });

    const created = await app.inject({
      method: 'POST',
      url: '/api/todos',
      headers: adaCookie,
      payload: { title: '  Write tests  ' },
    });
    expect(created.statusCode).toBe(201);
    const todo = created.json<Todo>();
    expect(todo).toMatchObject({ title: 'Write tests', completed: false });

    const patched = await app.inject({
      method: 'PATCH',
      url: `/api/todos/${todo.id}`,
      headers: adaCookie,
      payload: { completed: true },
    });
    expect(patched.statusCode).toBe(200);
    expect(patched.json()).toMatchObject({ id: todo.id, title: 'Write tests', completed: true });

    const grace = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'grace@example.com', password: 'password1' },
    });
    const graceCookie = sessionHeader(grace);
    const graceList = await app.inject({ method: 'GET', url: '/api/todos', headers: graceCookie });
    expect(graceList.json()).toEqual([]);

    const foreignPatch = await app.inject({
      method: 'PATCH',
      url: `/api/todos/${todo.id}`,
      headers: graceCookie,
      payload: { title: 'Stolen' },
    });
    expect(foreignPatch.statusCode).toBe(404);
    expect(foreignPatch.json()).toEqual({ message: 'Todo not found.' });

    const foreignDelete = await app.inject({
      method: 'DELETE',
      url: `/api/todos/${todo.id}`,
      headers: graceCookie,
    });
    expect(foreignDelete.statusCode).toBe(404);

    const adaList = await app.inject({ method: 'GET', url: '/api/todos', headers: adaCookie });
    expect(adaList.json()).toEqual([
      expect.objectContaining({ id: todo.id, title: 'Write tests', completed: true }),
    ]);

    const removed = await app.inject({
      method: 'DELETE',
      url: `/api/todos/${todo.id}`,
      headers: adaCookie,
    });
    expect(removed.statusCode).toBe(204);
    const afterDelete = await app.inject({ method: 'GET', url: '/api/todos', headers: adaCookie });
    expect(afterDelete.json()).toEqual([]);

    const missing = await app.inject({
      method: 'DELETE',
      url: `/api/todos/${todo.id}`,
      headers: adaCookie,
    });
    expect(missing.statusCode).toBe(404);
  });
});
