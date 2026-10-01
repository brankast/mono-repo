import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DsButtonControl, DsInputControl } from '@mono/angular-ds';
import { passwordMinLength } from '@mono/contracts';
import { AuthClient, AuthRequestError } from './auth-client';

@Component({
  selector: 'app-sign-in-page',
  imports: [ReactiveFormsModule, RouterLink, DsInputControl, DsButtonControl],
  templateUrl: './sign-in-page.html',
})
export class SignInPage {
  readonly passwordMinLength = passwordMinLength;
  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true }),
  });
  formError = '';
  submitting = false;
  private readonly auth = inject(AuthClient);
  private readonly changes = inject(ChangeDetectorRef);

  constructor() {
    this.form.valueChanges.subscribe(() => {
      if (this.formError === '') {
        return;
      }
      this.formError = '';
      this.changes.detectChanges();
    });
  }

  async submit(event: Event): Promise<void> {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.checkValidity() || this.submitting) {
      return;
    }
    this.formError = '';
    this.submitting = true;
    try {
      await this.auth.login(this.form.getRawValue());
      this.auth.continueToTodo();
    } catch (error) {
      this.formError = error instanceof AuthRequestError ? error.message : 'Something went wrong.';
      this.submitting = false;
      this.changes.detectChanges();
    }
  }
}
