import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { LoginRequest } from '@mono/contracts';
import type { DsButton, DsInput } from '@mono/design-system';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthClient, AuthRequestError } from '../auth-client';
import { SignInPage } from './sign-in-page';

class FakeAuthClient {
  loginBody: LoginRequest | null = null;
  failure: string | null = null;
  wentToTodo = false;

  async login(body: LoginRequest): Promise<void> {
    this.loginBody = body;
    if (this.failure !== null) {
      throw new AuthRequestError(this.failure);
    }
  }

  continueToTodo(): void {
    this.wentToTodo = true;
  }
}

function field(root: ParentNode, label: string): DsInput {
  const fields = [...root.querySelectorAll('ds-input')] as DsInput[];
  const match = fields.find((item) => item.label === label);
  if (match === undefined) {
    throw new Error(`missing ${label} field`);
  }
  return match;
}

async function setValue(control: DsInput, value: string): Promise<void> {
  await control.updateComplete;
  const input = control.shadowRoot?.querySelector('input');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`missing ${control.label} input`);
  }
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await control.updateComplete;
}

function errorText(control: DsInput): string {
  return control.shadowRoot?.querySelector('.error')?.textContent ?? '';
}

async function clickSubmit(root: ParentNode): Promise<void> {
  const button = root.querySelector('ds-button') as DsButton | null;
  if (button === null) {
    throw new Error('missing submit button');
  }
  await button.updateComplete;
  button.shadowRoot?.querySelector('button')?.click();
  await button.updateComplete;
}

describe('sign-in page', () => {
  let fixture: ComponentFixture<SignInPage>;
  let auth: FakeAuthClient;

  beforeEach(async () => {
    auth = new FakeAuthClient();
    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [provideRouter([]), { provide: AuthClient, useValue: auth }],
    }).compileComponents();
    fixture = TestBed.createComponent(SignInPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('keeps an empty form on the page and shows the field messages', async () => {
    const email = field(fixture.nativeElement, 'Email');
    const password = field(fixture.nativeElement, 'Password');
    await Promise.all([email.updateComplete, password.updateComplete]);

    await clickSubmit(fixture.nativeElement);
    await Promise.all([email.updateComplete, password.updateComplete]);

    expect(auth.loginBody).toBeNull();
    expect(errorText(email)).toBe('This field is required.');
    expect(errorText(password)).toBe('This field is required.');
  });

  it('shows the email and password messages from the fields', async () => {
    const email = field(fixture.nativeElement, 'Email');
    const password = field(fixture.nativeElement, 'Password');
    await setValue(email, 'not-an-email');
    await setValue(password, 'short');

    await clickSubmit(fixture.nativeElement);
    await Promise.all([email.updateComplete, password.updateComplete]);

    expect(auth.loginBody).toBeNull();
    expect(errorText(email)).toBe('Enter a valid email address.');
    expect(errorText(password)).toBe('Use at least 8 characters.');
  });

  it('signs in and continues to the todo app', async () => {
    const email = field(fixture.nativeElement, 'Email');
    const password = field(fixture.nativeElement, 'Password');
    await setValue(email, 'ada@example.com');
    await setValue(password, 'password1');

    await clickSubmit(fixture.nativeElement);
    await fixture.whenStable();

    expect(auth.loginBody).toEqual({ email: 'ada@example.com', password: 'password1' });
    expect(auth.wentToTodo).toBe(true);
  });

  it('shows the API message and stays on the page', async () => {
    auth.failure = 'Email or password is incorrect.';
    const email = field(fixture.nativeElement, 'Email');
    const password = field(fixture.nativeElement, 'Password');
    await setValue(email, 'ada@example.com');
    await setValue(password, 'password1');

    await clickSubmit(fixture.nativeElement);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(auth.wentToTodo).toBe(false);
    expect(fixture.nativeElement.querySelector('.form-error')?.textContent).toBe(
      'Email or password is incorrect.',
    );
  });
});
