import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { RegisterRequest } from '@mono/contracts';
import type { DsButton, DsInput } from '@mono/design-system';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AuthClient, AuthRequestError } from '../auth-client';
import { RegisterPage } from './register-page';

class FakeAuthClient {
  registerBody: RegisterRequest | null = null;
  failure: string | null = null;
  wentToTodo = false;

  async register(body: RegisterRequest): Promise<void> {
    this.registerBody = body;
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

describe('register page', () => {
  let fixture: ComponentFixture<RegisterPage>;
  let auth: FakeAuthClient;

  beforeEach(async () => {
    auth = new FakeAuthClient();
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([]), { provide: AuthClient, useValue: auth }],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('shows a mismatch after confirm password is left and blocks submit', async () => {
    const email = field(fixture.nativeElement, 'Email');
    const password = field(fixture.nativeElement, 'Password');
    const confirm = field(fixture.nativeElement, 'Confirm password');
    await setValue(email, 'ada@example.com');
    await setValue(password, 'password1');
    await setValue(confirm, 'password2');
    confirm.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true }));
    fixture.detectChanges();
    await confirm.updateComplete;

    expect(errorText(confirm)).toBe('Passwords do not match.');

    await clickSubmit(fixture.nativeElement);
    expect(auth.registerBody).toBeNull();
  });

  it('accepts matching passwords', async () => {
    const email = field(fixture.nativeElement, 'Email');
    const password = field(fixture.nativeElement, 'Password');
    const confirm = field(fixture.nativeElement, 'Confirm password');
    await setValue(email, 'ada@example.com');
    await setValue(password, 'password1');
    await setValue(confirm, 'password2');
    confirm.dispatchEvent(new FocusEvent('focusout', { bubbles: true, composed: true }));
    fixture.detectChanges();
    await setValue(confirm, 'password1');
    fixture.detectChanges();
    await confirm.updateComplete;

    expect(errorText(confirm)).toBe('');

    await clickSubmit(fixture.nativeElement);
    await fixture.whenStable();
    expect(auth.registerBody).toEqual({ email: 'ada@example.com', password: 'password1' });
    expect(auth.wentToTodo).toBe(true);
  });

  it('shows a duplicate account message from the API', async () => {
    auth.failure = 'An account with this email already exists.';
    const email = field(fixture.nativeElement, 'Email');
    const password = field(fixture.nativeElement, 'Password');
    const confirm = field(fixture.nativeElement, 'Confirm password');
    await setValue(email, 'ada@example.com');
    await setValue(password, 'password1');
    await setValue(confirm, 'password1');

    await clickSubmit(fixture.nativeElement);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(auth.wentToTodo).toBe(false);
    expect(fixture.nativeElement.querySelector('.form-error')?.textContent).toBe(
      'An account with this email already exists.',
    );
  });
});
