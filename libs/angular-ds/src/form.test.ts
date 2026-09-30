import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import type { DsButton, DsInput, DsSelect } from '@mono/design-system';
import { describe, expect, it } from 'vitest';
import { DsButtonControl, DsInputControl, DsSelectControl } from './controls.js';

@Component({
  imports: [ReactiveFormsModule, DsInputControl, DsSelectControl, DsButtonControl],
  template: `
    <form [formGroup]="form" (ngSubmit)="submitted = form.getRawValue()">
      <ds-input formControlName="email" label="Email" type="email"></ds-input>
      <ds-select formControlName="status" label="Status" [options]="options"></ds-select>
      <ds-button type="submit">Save</ds-button>
    </form>
  `,
})
class Host {
  readonly options = [
    { value: 'active', label: 'Active' },
    { value: 'done', label: 'Done' },
  ];
  readonly form = new FormGroup({
    email: new FormControl('ada@example.com', { nonNullable: true }),
    status: new FormControl('active', { nonNullable: true }),
  });
  submitted: { email: string; status: string } | null = null;
}

describe('angular design system form', () => {
  it('reads input and select values and submits through the button', async () => {
    await TestBed.configureTestingModule({
      imports: [Host],
    }).compileComponents();

    const fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    const email = fixture.nativeElement.querySelector('ds-input') as DsInput;
    const status = fixture.nativeElement.querySelector('ds-select') as DsSelect;
    await Promise.all([email.updateComplete, status.updateComplete]);

    expect(host.form.getRawValue()).toEqual({
      email: 'ada@example.com',
      status: 'active',
    });
    expect(email.value).toBe('ada@example.com');
    expect(status.value).toBe('active');

    const emailField = email.shadowRoot?.querySelector('input');
    if (!(emailField instanceof HTMLInputElement)) {
      throw new Error('missing email field');
    }
    emailField.value = 'grace@example.com';
    emailField.dispatchEvent(new Event('input', { bubbles: true, composed: true }));

    const statusField = status.shadowRoot?.querySelector('select');
    if (!(statusField instanceof HTMLSelectElement)) {
      throw new Error('missing status field');
    }
    statusField.value = 'done';
    statusField.dispatchEvent(new Event('change', { bubbles: true, composed: true }));

    expect(host.form.getRawValue()).toEqual({
      email: 'grace@example.com',
      status: 'done',
    });

    const button = fixture.nativeElement.querySelector('ds-button') as DsButton;
    await button.updateComplete;
    button.shadowRoot?.querySelector('button')?.click();

    expect(host.submitted).toEqual({
      email: 'grace@example.com',
      status: 'done',
    });
  });
});
