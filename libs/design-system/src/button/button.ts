import { LitElement, css, html } from 'lit';

export type ButtonType = 'button' | 'submit' | 'reset';
export type ButtonVariant = 'primary' | 'secondary' | 'danger';

export class DsButton extends LitElement {
  static formAssociated = true;

  static shadowRootOptions = { mode: 'open' as const, delegatesFocus: true };

  static properties = {
    type: { type: String, reflect: true },
    variant: { type: String, reflect: true },
    disabled: { type: Boolean, reflect: true },
    loading: { type: Boolean, reflect: true },
  };

  declare type: ButtonType;
  declare variant: ButtonVariant;
  declare disabled: boolean;
  declare loading: boolean;

  static styles = css`
    :host {
      display: inline-block;
      font-family: var(--ds-font, system-ui, sans-serif);
    }

    button {
      height: var(--ds-control-height, 2.5rem);
      padding: 0 var(--ds-space-4, 1rem);
      border: 1px solid transparent;
      border-radius: var(--ds-radius, 6px);
      background: var(--ds-color-primary, #2563eb);
      color: var(--ds-color-on-primary, #ffffff);
      font: inherit;
      cursor: pointer;
    }

    :host([variant='secondary']) button {
      background: var(--ds-color-surface, #f4f4f5);
      color: var(--ds-color-text, #18181b);
      border-color: var(--ds-color-border, #d4d4d8);
    }

    :host([variant='danger']) button {
      background: var(--ds-color-danger, #dc2626);
      color: var(--ds-color-on-danger, #ffffff);
    }

    button:focus-visible {
      outline: 2px solid var(--ds-color-focus, #2563eb);
      outline-offset: 2px;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  #internals: ElementInternals;

  constructor() {
    super();
    this.#internals = this.attachInternals();
    this.type = 'button';
    this.variant = 'primary';
    this.disabled = false;
    this.loading = false;
  }

  override updated(): void {
    const inactive = this.disabled || this.loading;
    this.#internals.ariaDisabled = inactive ? 'true' : null;
    this.#internals.ariaBusy = this.loading ? 'true' : null;
  }

  #activate(event: Event): void {
    if (this.disabled || this.loading) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    const form = this.#internals.form;
    if (form === null) {
      return;
    }
    if (this.type === 'submit') {
      if (!form.checkValidity()) {
        return;
      }
      form.requestSubmit();
    }
    if (this.type === 'reset') {
      form.reset();
    }
  }

  override render() {
    return html`
      <button
        type="button"
        part="button"
        ?disabled=${this.disabled || this.loading}
        @click=${this.#activate}
      >
        <slot></slot>
      </button>
    `;
  }
}

const tagName = 'ds-button';

if (!customElements.get(tagName)) {
  customElements.define(tagName, DsButton);
}
