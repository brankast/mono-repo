import { LitElement, css, html, nothing } from 'lit';
import { live } from 'lit/directives/live.js';

export type InputType = 'text' | 'email' | 'password';

let nextId = 0;

export class DsInput extends LitElement {
  static formAssociated = true;

  static shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };

  static properties = {
    label: { type: String },
    name: { type: String, reflect: true },
    type: { type: String, reflect: true },
    placeholder: { type: String },
    value: { type: String },
    error: { type: String },
    required: { type: Boolean, reflect: true },
    disabled: { type: Boolean, reflect: true },
  };

  declare label: string;
  declare name: string;
  declare type: InputType;
  declare placeholder: string;
  declare value: string;
  declare error: string;
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

    input {
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

    input:focus-visible {
      outline: 2px solid var(--ds-color-focus, #2563eb);
      outline-offset: 2px;
    }

    input[aria-invalid='true'] {
      border-color: var(--ds-color-danger, #dc2626);
    }

    input:disabled {
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
  #inputId: string;
  #errorId: string;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    const id = ++nextId;
    this.#inputId = `ds-input-${id}`;
    this.#errorId = `ds-input-${id}-error`;
    this.label = '';
    this.name = '';
    this.type = 'text';
    this.placeholder = '';
    this.value = '';
    this.error = '';
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

  #field(): HTMLInputElement | null {
    const field = this.renderRoot.querySelector('input');
    return field instanceof HTMLInputElement ? field : null;
  }

  #inputType(): InputType {
    if (this.type === 'email' || this.type === 'password') {
      return this.type;
    }
    return 'text';
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

  #onInput(event: Event): void {
    const target = event.target;
    if (target instanceof HTMLInputElement) {
      this.value = target.value;
    }
  }

  override render() {
    const invalid = this.error !== '';
    return html`
      ${this.label
        ? html`<label for=${this.#inputId}>${this.label}</label>`
        : nothing}
      <input
        id=${this.#inputId}
        part="input"
        type=${this.#inputType()}
        name=${this.name}
        .value=${live(this.value)}
        placeholder=${this.placeholder || nothing}
        ?required=${this.required}
        ?disabled=${this.disabled}
        aria-invalid=${invalid ? 'true' : 'false'}
        aria-describedby=${invalid ? this.#errorId : nothing}
        @input=${this.#onInput}
      />
      ${invalid
        ? html`<p class="error" id=${this.#errorId} part="error">${this.error}</p>`
        : nothing}
    `;
  }
}

const tagName = 'ds-input';

if (!customElements.get(tagName)) {
  customElements.define(tagName, DsInput);
}
