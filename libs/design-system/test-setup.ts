// happy-dom does not implement ElementInternals yet. This covers the
// form and ARIA surface the controls use, and only runs in tests.
if (!('attachInternals' in HTMLElement.prototype)) {
  const controlValidity = new WeakMap<HTMLElement, boolean>();
  const originalReset = HTMLFormElement.prototype.reset;
  const originalRequestSubmit = HTMLFormElement.prototype.requestSubmit;
  HTMLFormElement.prototype.reset = function reset(this: HTMLFormElement) {
    originalReset.call(this);
    for (const element of this.querySelectorAll('*')) {
      const control = element as HTMLElement & { formResetCallback?: () => void };
      control.formResetCallback?.();
    }
  };
  HTMLFormElement.prototype.requestSubmit = function requestSubmit(
    this: HTMLFormElement,
    submitter?: HTMLElement,
  ) {
    const invalidControls = [...this.querySelectorAll('*')].filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && controlValidity.get(element) === true,
    );
    if (invalidControls.length > 0) {
      for (const control of invalidControls) {
        control.dispatchEvent(new Event('invalid', { cancelable: true }));
      }
      return;
    }
    originalRequestSubmit.call(this, submitter);
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
        setValidity(flags: ValidityStateFlags = {}) {
          const invalid = Object.values(flags).some((flag) => flag === true);
          controlValidity.set(element, invalid);
        },
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
