import { Directive, ElementRef, inject, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import '@mono/design-system';
import type { DsInput, DsSelect, SelectOption } from '@mono/design-system';

type FieldElement = DsInput | DsSelect;

class FieldControl implements ControlValueAccessor {
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  constructor(
    private readonly element: FieldElement,
    eventName: 'input' | 'change',
  ) {
    this.element.addEventListener(eventName, () => {
      this.onChange(this.element.value);
    });
    this.element.addEventListener('focusout', () => {
      this.onTouched();
    });
  }

  writeValue(value: string | null): void {
    this.element.value = value ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.element.disabled = isDisabled;
  }
}

@Directive({
  selector: 'ds-input',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: DsInputControl,
      multi: true,
    },
  ],
})
export class DsInputControl extends FieldControl {
  constructor() {
    super(inject<ElementRef<DsInput>>(ElementRef).nativeElement, 'input');
  }
}

@Directive({
  selector: 'ds-select',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: DsSelectControl,
      multi: true,
    },
  ],
})
export class DsSelectControl extends FieldControl {
  private readonly select: DsSelect;

  constructor() {
    const select = inject<ElementRef<DsSelect>>(ElementRef).nativeElement;
    super(select, 'change');
    this.select = select;
  }

  @Input()
  set options(value: SelectOption[] | null) {
    this.select.options = value ?? [];
  }
}

@Directive({
  selector: 'ds-button',
})
export class DsButtonControl {}
