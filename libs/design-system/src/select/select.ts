import { LitElement, css, html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';

export type SelectOption = {
  value: string;
  label: string;
};

let nextId = 0;

export class DsSelect extends LitElement {
  static formAssociated = true;

  static shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };

  static properties = {
    label: { type: String },
    name: { type: String, reflect: true },
    placeholder: { type: String },
    value: { type: String },
    error: { type: String },
    options: { attribute: false },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare name: string;
  declare placeholder: string;
  declare value: string;
  declare error: string;
  declare options: SelectOption[];
  declare required: boolean;
  declare disabled: boolean;

  static styles = css`
    :host {
      display: block;
      font-family: var(--ds-font, system-ui, sans-serif);
      color: var(--ds-color-text, #18181b);
    }

    label {
      display: block;
      margin-bottom: var(--ds-space-1, 0.25rem);
    }

    select {
      box-sizing: border-box;
      width: 100%;
      height: var(--ds-control-height, 2.5rem);
      padding: 0 var(--ds-space-3, 0.75rem);
      border: 1px solid var(--ds-color-border, #d4d4d8);
      border-radius: var(--ds-radius, 6px);
      background: var(--ds-color-bg, #ffffff);
      color: inherit;
      font: inherit;
    }

    select:focus-visible {
      outline: 2px solid var(--ds-color-focus, #2563eb);
      outline-offset: 2px;
    }

    select[aria-invalid='true'] {
      border-color: var(--ds-color-danger, #dc2626);
    }

    select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error {
      margin: var(--ds-space-1, 0.25rem) 0 0;
      color: var(--ds-color-danger, #dc2626);
      font-size: 0.875rem;
    }
  `;

  #internals: ElementInternals;
  #selectId: string;
  #errorId: string;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    const id = ++nextId;
    this.#selectId = `ds-select-${id}`;
    this.#errorId = `ds-select-${id}-error`;
    this.label = '';
    this.name = '';
    this.placeholder = '';
    this.value = '';
    this.error = '';
    this.options = [];
    this.required = false;
    this.disabled = false;
  }

  formResetCallback(): void {
    this.value = '';
  }

  override updated(): void {
    this.#syncForm();
    this.#internals.ariaDisabled = this.disabled ? 'true' : null;
  }

  #field(): HTMLSelectElement | null {
    const field = this.renderRoot.querySelector('select');
    return field instanceof HTMLSelectElement ? field : null;
  }

  #syncForm(): void {
    const field = this.#field();
    if (this.disabled) {
      this.#internals.setFormValue(null);
      this.#internals.setValidity({});
      return;
    }

    this.#internals.setFormValue(this.value);
    if (this.error !== '') {
      this.#internals.setValidity({ customError: true }, this.error, field ?? undefined);
      return;
    }
    this.#internals.setValidity({});
  }

  #onChange(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLSelectElement) {
      this.value = target.value;
    }
  }

  override render() {
    const invalid = this.error !== '';
    return html`
      ${this.label
        ? html`<label for=${this.#selectId}>${this.label}</label>`
        : nothing}
      <select
        id=${this.#selectId}
        part="select"
        name=${this.name}
        .value=${live(this.value)}
        ?required=${this.required}
        ?disabled=${this.disabled}
        aria-invalid=${invalid ? 'true' : 'false'}
        aria-describedby=${invalid ? this.#errorId : nothing}
        @change=${this.#onChange}
      >
        ${this.placeholder
          ? html`<option value="" disabled>${this.placeholder}</option>`
          : nothing}
        ${this.options.map(
          (option) => html`<option value=${option.value}>${option.label}</option>`,
        )}
      </select>
      ${invalid
        ? html`<p class="error" id=${this.#errorId} part="error">${this.error}</p>`
        : nothing}
    `;
  }
}

const tagName = 'ds-select';

if (!customElements.get(tagName)) {
  customElements.define(tagName, DsSelect);
}
