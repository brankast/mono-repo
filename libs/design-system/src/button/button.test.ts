import { beforeEach, describe, expect, it } from 'vitest';
import type { DsButton } from './button.js';
import './button.js';

function createButton(): DsButton {
  const button = document.createElement('ds-button') as DsButton;
  document.body.append(button);
  return button;
}

describe('ds-button', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('renders slotted text and defaults to primary button', async () => {
    const button = createButton();
    button.textContent = 'Save';
    await button.updateComplete;

    const inner = button.shadowRoot?.querySelector('button');
    const slot = inner?.querySelector('slot');
    expect(button.type).toBe('button');
    expect(button.variant).toBe('primary');
    expect(slot?.assignedNodes()[0]?.textContent).toBe('Save');
    expect(inner?.disabled).toBe(false);
  });

  it('disables the inner button while disabled or loading', async () => {
    const button = createButton();
    button.disabled = true;
    await button.updateComplete;

    expect(button.shadowRoot?.querySelector('button')?.disabled).toBe(true);
    expect(button.getAttribute('aria-disabled')).toBe('true');

    button.disabled = false;
    button.loading = true;
    await button.updateComplete;

    expect(button.shadowRoot?.querySelector('button')?.disabled).toBe(true);
    expect(button.getAttribute('aria-busy')).toBe('true');
  });

  it('submits and resets the parent form', async () => {
    const form = document.createElement('form');
    const name = document.createElement('input');
    name.name = 'title';
    name.value = 'Milk';
    const submit = document.createElement('ds-button') as DsButton;
    submit.type = 'submit';
    const reset = document.createElement('ds-button') as DsButton;
    reset.type = 'reset';
    form.append(name, submit, reset);
    document.body.append(form);
    await submit.updateComplete;
    await reset.updateComplete;

    let submitted = 0;
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      submitted += 1;
    });

    submit.shadowRoot?.querySelector('button')?.click();
    expect(submitted).toBe(1);

    reset.shadowRoot?.querySelector('button')?.click();
    expect(name.value).toBe('');
  });
});
