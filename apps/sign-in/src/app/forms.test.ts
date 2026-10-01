import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { DsButton, DsInput } from '@mono/design-system';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { RegisterPage } from './register-page';
import { SignInPage } from './sign-in-page';

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

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignInPage],
      providers: [provideRouter([])],
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

    expect(fixture.componentInstance.submitted).toBeNull();
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

    expect(fixture.componentInstance.submitted).toBeNull();
    expect(errorText(email)).toBe('Enter a valid email address.');
    expect(errorText(password)).toBe('Use at least 8 characters.');
  });

  it('accepts a valid email and password', async () => {
    const email = field(fixture.nativeElement, 'Email');
    const password = field(fixture.nativeElement, 'Password');
    await setValue(email, 'ada@example.com');
    await setValue(password, 'password1');

    await clickSubmit(fixture.nativeElement);

    expect(fixture.componentInstance.submitted).toEqual({
      email: 'ada@example.com',
      password: 'password1',
    });
  });
});

describe('register page', () => {
  let fixture: ComponentFixture<RegisterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [provideRouter([])],
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
    expect(fixture.componentInstance.submitted).toBeNull();
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
    expect(fixture.componentInstance.submitted).toEqual({
      email: 'ada@example.com',
      password: 'password1',
      confirmPassword: 'password1',
    });
  });
});
