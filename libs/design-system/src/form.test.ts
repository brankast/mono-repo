import { beforeEach, describe, expect, it } from 'vitest';
import type { DsButton } from './button/button.js';
import type { DsInput } from './input/input.js';
import type { DsSelect } from './select/select.js';
import './index.js';

describe('design system form', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('submits input and select values through the button', async () => {
    const form = document.createElement('form');
    const email = document.createElement('ds-input') as DsInput;
    email.label = 'Email';
    email.name = 'email';
    email.type = 'email';
    const status = document.createElement('ds-select') as DsSelect;
    status.label = 'Status';
    status.name = 'status';
    status.options = [
      { value: 'active', label: 'Active' },
      { value: 'done', label: 'Done' },
    ];
    const save = document.createElement('ds-button') as DsButton;
    save.type = 'submit';
    save.textContent = 'Save';
    form.append(email, status, save);
    document.body.append(form);

    email.value = 'ada@example.com';
    status.value = 'active';
    await Promise.all([email.updateComplete, status.updateComplete, save.updateComplete]);

    let submitted = 0;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted += 1;
    });
    save.shadowRoot?.querySelector('button')?.click();

    expect(submitted).toBe(1);
    expect(email.getAttribute('data-form-value')).toBe('ada@example.com');
    expect(status.getAttribute('data-form-value')).toBe('active');
  });
});
