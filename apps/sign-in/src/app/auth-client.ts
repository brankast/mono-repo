import { Injectable } from '@angular/core';
import type { LoginRequest, RegisterRequest } from '@mono/contracts';

export class AuthRequestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthRequestError';
  }
}

@Injectable({ providedIn: 'root' })
export class AuthClient {
  register(body: RegisterRequest): Promise<void> {
    return postJson('/api/auth/register', body);
  }

  login(body: LoginRequest): Promise<void> {
    return postJson('/api/auth/login', body);
  }

  continueToTodo(): void {
    globalThis.location.assign('/todo/');
  }
}

async function postJson(path: string, body: RegisterRequest | LoginRequest): Promise<void> {
  let response: Response;
  try {
    response = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthRequestError('Something went wrong.');
  }
  if (response.ok) {
    return;
  }
  throw new AuthRequestError(await readMessage(response));
}

async function readMessage(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (isErrorBody(payload)) {
      return payload.message;
    }
  } catch {
    // The response was not JSON.
  }
  return 'Something went wrong.';
}

function isErrorBody(value: unknown): value is { message: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string' &&
    value.message !== ''
  );
}
