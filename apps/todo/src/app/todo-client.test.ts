import { afterEach, describe, expect, it } from 'vitest';
import { TodoClient, TodoRequestError } from './todo-client';

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

describe('todo client', () => {
  it('loads the user and their todos', async () => {
    const calls: string[] = [];
    globalThis.fetch = async (input) => {
      const path = String(input);
      calls.push(path);
      if (path === '/api/auth/me') {
        return jsonResponse(200, { id: '1', email: 'ada@example.com' });
      }
      return jsonResponse(200, [
        { id: 't1', title: 'Buy milk', completed: false, createdAt: '2026-10-01T00:00:00.000Z' },
      ]);
    };
    const client = new TodoClient();

    await expect(client.currentUser()).resolves.toEqual({ id: '1', email: 'ada@example.com' });
    await expect(client.list()).resolves.toEqual([
      { id: 't1', title: 'Buy milk', completed: false, createdAt: '2026-10-01T00:00:00.000Z' },
    ]);
    expect(calls).toEqual(['/api/auth/me', '/api/todos']);
  });

  it('creates, updates, and deletes a todo', async () => {
    const calls: { path: string; method: string; body: string }[] = [];
    globalThis.fetch = async (input, init) => {
      calls.push({ path: String(input), method: init?.method ?? 'GET', body: String(init?.body ?? '') });
      if (init?.method === 'POST') {
        return jsonResponse(201, {
          id: 't1',
          title: 'Buy milk',
          completed: false,
          createdAt: '2026-10-01T00:00:00.000Z',
        });
      }
      if (init?.method === 'PATCH') {
        return jsonResponse(200, {
          id: 't1',
          title: 'Buy milk',
          completed: true,
          createdAt: '2026-10-01T00:00:00.000Z',
        });
      }
      return new Response(null, { status: 204 });
    };
    const client = new TodoClient();

    await client.create('Buy milk');
    await client.setCompleted('t1', true);
    await client.remove('t1');

    expect(calls).toEqual([
      { path: '/api/todos', method: 'POST', body: JSON.stringify({ title: 'Buy milk' }) },
      { path: '/api/todos/t1', method: 'PATCH', body: JSON.stringify({ completed: true }) },
      { path: '/api/todos/t1', method: 'DELETE', body: '' },
    ]);
  });

  it('uses the API message when the request fails', async () => {
    globalThis.fetch = async () => jsonResponse(401, { message: 'Sign in to continue.' });

    await expect(new TodoClient().list()).rejects.toEqual(new TodoRequestError('Sign in to continue.', 401));
  });

  it('reports a generic message when the API cannot be reached', async () => {
    globalThis.fetch = async () => {
      throw new Error('offline');
    };

    await expect(new TodoClient().logout()).rejects.toEqual(new TodoRequestError('Something went wrong.', 0));
  });
});
