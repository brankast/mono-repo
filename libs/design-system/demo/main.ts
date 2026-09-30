import '../src/tokens.css';
import type { DsSelect } from '../src/select/select.js';
import '../src/index.js';

const status = document.querySelector('ds-select');
if (status instanceof HTMLElement) {
  (status as DsSelect).options = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'done', label: 'Done' },
  ];
}

const form = document.querySelector('form');
const result = document.querySelector('#result');

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!(form instanceof HTMLFormElement) || !(result instanceof HTMLElement)) {
    return;
  }

  const entries = [...new FormData(form).entries()].map(
    ([key, value]) => `${key}: ${String(value)}`,
  );
  result.textContent = entries.length > 0 ? entries.join('\n') : 'Nothing submitted.';
});
