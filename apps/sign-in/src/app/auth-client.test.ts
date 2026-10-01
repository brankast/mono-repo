import type { LoginRequest, RegisterRequest } from '@mono/contracts';
import { afterEach, describe, expect, it } from 'vitest';
import { AuthClient, AuthRequestError } from './auth-client';

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('auth client', () => {
  it('posts credentials to register and login', async () => {
    const calls: { path: string; body: string }[] = [];
    globalThis.fetch = async (input, init) => {
      calls.push({ path: String(input), body: String(init?.body) });
      return jsonResponse(200, { id: '1', email: 'ada@example.com' });
    };
    const client = new AuthClient();
    const credentials: RegisterRequest = { email: 'ada@example.com', password: 'password1' };

    await client.register(credentials);
    await client.login(credentials satisfies LoginRequest);

    expect(calls).toEqual([
      { path: '/api/auth/register', body: JSON.stringify(credentials) },
      { path: '/api/auth/login', body: JSON.stringify(credentials) },
    ]);
  });

  it('uses the API message when the request fails', async () => {
    globalThis.fetch = async () => jsonResponse(401, { message: 'Email or password is incorrect.' });

    await expect(
      new AuthClient().login({ email: 'ada@example.com', password: 'password1' }),
    ).rejects.toThrow(new AuthRequestError('Email or password is incorrect.'));
  });

  it('reports a generic message when the API cannot be reached', async () => {
    globalThis.fetch = async () => {
      throw new Error('offline');
    };

    await expect(
      new AuthClient().register({ email: 'ada@example.com', password: 'password1' }),
    ).rejects.toThrow(new AuthRequestError('Something went wrong.'));
  });
});
