// happy-dom does not implement ElementInternals yet. This covers the
// form and ARIA surface the controls use, and only runs in tests.
if (!('attachInternals' in HTMLElement.prototype)) {
  const originalReset = HTMLFormElement.prototype.reset;
  HTMLFormElement.prototype.reset = function reset(this: HTMLFormElement) {
    originalReset.call(this);
    for (const element of this.querySelectorAll('*')) {
      const control = element as HTMLElement & { formResetCallback?: () => void };
      control.formResetCallback?.();
    }
  };

  Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
    configurable: true,
    value(this: HTMLElement) {
      const element = this;
      return {
        get form(): HTMLFormElement | null {
          return element.closest('form');
        },
        setFormValue(value: string | File | FormData | null) {
          if (typeof value === 'string') {
            element.setAttribute('data-form-value', value);
          } else {
            element.removeAttribute('data-form-value');
          }
        },
        setValidity() {},
        set ariaDisabled(value: string | null) {
          if (value === null) {
            element.removeAttribute('aria-disabled');
          } else {
            element.setAttribute('aria-disabled', value);
          }
        },
        set ariaBusy(value: string | null) {
          if (value === null) {
            element.removeAttribute('aria-busy');
          } else {
            element.setAttribute('aria-busy', value);
          }
        },
      };
    },
  });
}
