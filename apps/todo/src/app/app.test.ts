import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { App } from './app';
import { TodoClient, TodoRequestError } from './todo-client';

class FakeTodoClient {
  loggedOut = false;
  wentToSignIn = false;
  failure: string | null = null;

  async logout(): Promise<void> {
    this.loggedOut = true;
    if (this.failure !== null) {
      throw new TodoRequestError(this.failure, 500);
    }
  }

  goToSignIn(): void {
    this.wentToSignIn = true;
  }
}

describe('todo app', () => {
  let fixture: ComponentFixture<App>;
  let todos: FakeTodoClient;

  beforeEach(async () => {
    todos = new FakeTodoClient();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: TodoClient, useValue: todos }],
    }).compileComponents();
    fixture = TestBed.createComponent(App);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('ends the session and returns to sign in', async () => {
    fixture.nativeElement.querySelector('.sign-out')?.click();
    await fixture.whenStable();

    expect(todos.loggedOut).toBe(true);
    expect(todos.wentToSignIn).toBe(true);
  });

  it('shows a message when sign out fails', async () => {
    todos.failure = 'Something went wrong.';
    fixture.nativeElement.querySelector('.sign-out')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(todos.wentToSignIn).toBe(false);
    expect(fixture.nativeElement.querySelector('.form-error')?.textContent).toBe('Something went wrong.');
  });
});
