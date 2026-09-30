// happy-dom does not implement ElementInternals yet. This covers the
// form and ARIA surface ds-button uses, and only runs in tests.
if (!('attachInternals' in HTMLElement.prototype)) {
  Object.defineProperty(HTMLElement.prototype, 'attachInternals', {
    configurable: true,
    value(this: HTMLElement) {
      const element = this;
      return {
        get form(): HTMLFormElement | null {
          return element.closest('form');
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
