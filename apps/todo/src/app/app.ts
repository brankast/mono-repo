import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TodoClient, TodoRequestError } from './todo-client';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  signingOut = false;
  signOutError = '';
  private readonly todos = inject(TodoClient);
  private readonly changes = inject(ChangeDetectorRef);

  async signOut(): Promise<void> {
    if (this.signingOut) {
      return;
    }
    this.signOutError = '';
    this.signingOut = true;
    try {
      await this.todos.logout();
      this.todos.goToSignIn();
    } catch (error) {
      if (error instanceof TodoRequestError && error.status === 401) {
        this.todos.goToSignIn();
        return;
      }
      this.signOutError = error instanceof TodoRequestError ? error.message : 'Something went wrong.';
      this.signingOut = false;
      this.changes.detectChanges();
    }
  }
}
