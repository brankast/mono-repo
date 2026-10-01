import { Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DsButtonControl, DsInputControl } from '@mono/angular-ds';
import { passwordMinLength } from '@mono/contracts';

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
  submitted: { email: string; password: string } | null = null;

  submit(event: Event): void {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.checkValidity()) {
      return;
    }
    this.submitted = this.form.getRawValue();
  }
}
