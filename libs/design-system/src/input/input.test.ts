import { beforeEach, describe, expect, it } from 'vitest';
import type { DsInput } from './input.js';
import './input.js';

function createInput(): DsInput {
  const input = document.createElement('ds-input') as DsInput;
  document.body.append(input);
  return input;
}

function fieldOf(input: DsInput): HTMLInputElement {
  const field = input.shadowRoot?.querySelector('input');
  if (!(field instanceof HTMLInputElement)) {
    throw new Error('missing inner input');
  }
  return field;
}

describe('ds-input', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('associates the label and defaults to an empty text field', async () => {
    const input = createInput();
    input.label = 'Email';
    await input.updateComplete;

    const field = fieldOf(input);
    const label = input.shadowRoot?.querySelector('label');
    expect(input.type).toBe('text');
    expect(input.value).toBe('');
    expect(label?.textContent).toBe('Email');
    expect(label?.htmlFor).toBe(field.id);
    expect(field.type).toBe('text');
  });

  it('updates value from input and change events', async () => {
    const input = createInput();
    await input.updateComplete;
    const field = fieldOf(input);
    const seen: string[] = [];
    input.addEventListener('input', () => {
      seen.push(input.value);
    });

    field.value = 'ada@example.com';
    field.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    await input.updateComplete;

    expect(input.value).toBe('ada@example.com');
    expect(input.getAttribute('data-form-value')).toBe('ada@example.com');
    expect(seen).toEqual(['ada@example.com']);

    let changed = 0;
    input.addEventListener('change', () => {
      changed += 1;
    });
    field.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    expect(changed).toBe(1);
  });

  it('shows an error and disables the field', async () => {
    const input = createInput();
    input.type = 'password';
    input.error = 'Required';
    input.disabled = true;
    await input.updateComplete;

    const field = fieldOf(input);
    const message = input.shadowRoot?.querySelector('p');
    expect(field.type).toBe('password');
    expect(field.disabled).toBe(true);
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('aria-describedby')).toBe(message?.id);
    expect(message?.textContent).toBe('Required');
    expect(input.getAttribute('aria-disabled')).toBe('true');
    expect(input.hasAttribute('data-form-value')).toBe(false);
  });

  it('clears the value when the parent form resets', async () => {
    const form = document.createElement('form');
    const input = document.createElement('ds-input') as DsInput;
    form.append(input);
    document.body.append(form);
    input.value = 'Milk';
    await input.updateComplete;

    form.reset();
    await input.updateComplete;

    expect(input.value).toBe('');
    expect(fieldOf(input).value).toBe('');
  });
});
