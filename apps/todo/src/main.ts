import { bootstrapApplication } from '@angular/platform-browser';
import '@mono/angular-ds';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig).catch((error: unknown) => {
  console.error(error);
});
