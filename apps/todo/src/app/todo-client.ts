import { Injectable } from '@angular/core';
import type { CreateTodoRequest, Todo, UpdateTodoRequest, User } from '@mono/contracts';

export class TodoRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'TodoRequestError';
  }
}

@Injectable({ providedIn: 'root' })
export class TodoClient {
  currentUser(): Promise<User> {
    return requestJson('/api/auth/me');
  }

  list(): Promise<Todo[]> {
    return requestJson('/api/todos');
  }

  create(title: string): Promise<Todo> {
    const body: CreateTodoRequest = { title };
    return requestJson('/api/todos', { method: 'POST', body: JSON.stringify(body) });
  }

  setCompleted(id: string, completed: boolean): Promise<Todo> {
    const body: UpdateTodoRequest = { completed };
    return requestJson(`/api/todos/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
  }

  remove(id: string): Promise<void> {
    return requestEmpty(`/api/todos/${id}`, { method: 'DELETE' });
  }

  logout(): Promise<void> {
    return requestEmpty('/api/auth/logout', { method: 'POST' });
  }

  goToSignIn(): void {
    globalThis.location.assign('/sign-in/');
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await send(path, init);
  try {
    return (await response.json()) as T;
  } catch {
    throw new TodoRequestError('Something went wrong.', response.status);
  }
}

async function requestEmpty(path: string, init: RequestInit): Promise<void> {
  await send(path, init);
}

async function send(path: string, init?: RequestInit): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      headers: {
        ...(init?.body === undefined ? {} : { 'content-type': 'application/json' }),
        ...init?.headers,
      },
    });
  } catch {
    throw new TodoRequestError('Something went wrong.', 0);
  }
  if (response.ok) {
    return response;
  }
  throw new TodoRequestError(await readMessage(response), response.status);
}

async function readMessage(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (
      typeof payload === 'object' &&
      payload !== null &&
      'message' in payload &&
      typeof payload.message === 'string' &&
      payload.message !== ''
    ) {
      return payload.message;
    }
  } catch {
    // The response was not JSON.
  }
  return 'Something went wrong.';
}
