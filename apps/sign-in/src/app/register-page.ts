import { Component, ElementRef, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DsButtonControl, DsInputControl } from '@mono/angular-ds';
import type { DsInput } from '@mono/design-system';
import { passwordMinLength } from '@mono/contracts';

@Component({
  selector: 'app-register-page',
  imports: [ReactiveFormsModule, RouterLink, DsInputControl, DsButtonControl],
  templateUrl: './register-page.html',
})
export class RegisterPage {
  readonly passwordMinLength = passwordMinLength;
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
    confirmPassword: new FormControl('', { nonNullable: true }),
  });
  confirmError = '';
  submitted: { email: string; password: string; confirmPassword: string } | null = null;
  private readonly confirmPasswordField = viewChild<ElementRef<DsInput>>('confirmPassword');
  private confirmTouched = false;

  constructor() {
    this.form.controls.password.valueChanges.subscribe(() => this.syncConfirmError());
    this.form.controls.confirmPassword.valueChanges.subscribe(() => this.syncConfirmError());
  }

  onConfirmBlur(): void {
    this.confirmTouched = true;
    this.syncConfirmError();
  }

  submit(event: Event): void {
    this.confirmTouched = true;
    this.syncConfirmError();
    const form = event.target;
    if (this.confirmError !== '' || !(form instanceof HTMLFormElement) || !form.checkValidity()) {
      return;
    }
    this.submitted = this.form.getRawValue();
  }

  private syncConfirmError(): void {
    const password = this.form.controls.password.value;
    const confirmPassword = this.form.controls.confirmPassword.value;
    this.confirmError =
      this.confirmTouched && confirmPassword !== '' && confirmPassword !== password
        ? 'Passwords do not match.'
        : '';
    const field = this.confirmPasswordField()?.nativeElement;
    if (field !== undefined) {
      field.error = this.confirmError;
    }
  }
}
