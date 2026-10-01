import { ChangeDetectorRef, Component, ElementRef, inject, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DsButtonControl, DsInputControl } from '@mono/angular-ds';
import type { DsInput } from '@mono/design-system';
import { passwordMinLength } from '@mono/contracts';
import { AuthClient, AuthRequestError } from './auth-client';

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
  formError = '';
  submitting = false;
  private readonly confirmPasswordField = viewChild<ElementRef<DsInput>>('confirmPassword');
  private readonly auth = inject(AuthClient);
  private readonly changes = inject(ChangeDetectorRef);
  private confirmTouched = false;

  constructor() {
    this.form.controls.password.valueChanges.subscribe(() => this.syncConfirmError());
    this.form.controls.confirmPassword.valueChanges.subscribe(() => this.syncConfirmError());
    this.form.valueChanges.subscribe(() => {
      if (this.formError === '') {
        return;
      }
      this.formError = '';
      this.changes.detectChanges();
    });
  }

  onConfirmBlur(): void {
    this.confirmTouched = true;
    this.syncConfirmError();
  }

  async submit(event: Event): Promise<void> {
    this.confirmTouched = true;
    this.syncConfirmError();
    const form = event.target;
    if (
      this.confirmError !== '' ||
      !(form instanceof HTMLFormElement) ||
      !form.checkValidity() ||
      this.submitting
    ) {
      return;
    }
    this.formError = '';
    this.submitting = true;
    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.register({ email, password });
      this.auth.continueToTodo();
    } catch (error) {
      this.formError = error instanceof AuthRequestError ? error.message : 'Something went wrong.';
      this.submitting = false;
      this.changes.detectChanges();
    }
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
