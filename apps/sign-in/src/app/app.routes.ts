import { Routes } from '@angular/router';
import { RegisterPage } from './register-page/register-page';
import { SignInPage } from './sign-in-page/sign-in-page';

export const routes: Routes = [
  { path: '', pathMatch: 'full', title: 'Sign in', component: SignInPage },
  { path: 'register', title: 'Create an account', component: RegisterPage },
];
