import { beforeEach, describe, expect, it } from 'vitest';
import type { DsSelect } from './select.js';
import './select.js';

const options = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
];

function createSelect(): DsSelect {
  const select = document.createElement('ds-select') as DsSelect;
  document.body.append(select);
  return select;
}

function fieldOf(select: DsSelect): HTMLSelectElement {
  const field = select.shadowRoot?.querySelector('select');
  if (!(field instanceof HTMLSelectElement)) {
    throw new Error('missing inner select');
  }
  return field;
}

describe('ds-select', () => {
  beforeEach(() => {
    document.body.replaceChildren();
  });

  it('associates the label and renders options', async () => {
    const select = createSelect();
    select.label = 'Status';
    select.placeholder = 'Choose';
    select.options = options;
    await select.updateComplete;

    const field = fieldOf(select);
    const label = select.shadowRoot?.querySelector('label');
    const rendered = [...field.options].map((option) => ({
      value: option.value,
      label: option.textContent,
    }));

    expect(select.value).toBe('');
    expect(label?.textContent).toBe('Status');
    expect(label?.htmlFor).toBe(field.id);
    expect(rendered).toEqual([
      { value: '', label: 'Choose' },
      { value: 'all', label: 'All' },
      { value: 'active', label: 'Active' },
    ]);
  });

  it('updates value when the selection changes', async () => {
    const select = createSelect();
    select.options = options;
    await select.updateComplete;
    const field = fieldOf(select);
    let changed = 0;
    select.addEventListener('change', () => {
      changed += 1;
    });

    field.value = 'active';
    field.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
    await select.updateComplete;

    expect(changed).toBe(1);
    expect(select.value).toBe('active');
    expect(select.getAttribute('data-form-value')).toBe('active');
    expect(field.value).toBe('active');
  });

  it('shows an error and disables the field', async () => {
    const select = createSelect();
    select.options = options;
    select.error = 'Required';
    select.disabled = true;
    await select.updateComplete;

    const field = fieldOf(select);
    const message = select.shadowRoot?.querySelector('p');
    expect(field.disabled).toBe(true);
    expect(field.getAttribute('aria-invalid')).toBe('true');
    expect(field.getAttribute('aria-describedby')).toBe(message?.id);
    expect(message?.textContent).toBe('Required');
    expect(select.getAttribute('aria-disabled')).toBe('true');
    expect(select.hasAttribute('data-form-value')).toBe(false);
  });

  it('clears the value when the parent form resets', async () => {
    const form = document.createElement('form');
    const select = document.createElement('ds-select') as DsSelect;
    select.options = options;
    form.append(select);
    document.body.append(form);
    select.value = 'all';
    await select.updateComplete;

    form.reset();
    await select.updateComplete;

    expect(select.value).toBe('');
    expect(fieldOf(select).value).toBe('');
  });
});
