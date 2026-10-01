import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';
import type { Todo } from '@mono/contracts';
import type { DsButton, DsInput } from '@mono/design-system';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { TodoClient, TodoRequestError } from './todo-client';
import { TodosPage } from './todos-page';

const milk: Todo = {
  id: 't1',
  title: 'Buy milk',
  completed: false,
  createdAt: '2026-10-01T00:00:00.000Z',
};
const bread: Todo = {
  id: 't2',
  title: 'Buy bread',
  completed: true,
  createdAt: '2026-10-01T00:00:01.000Z',
};

class FakeTodoClient {
  items: Todo[] = [milk, bread];
  unauthorized = false;
  failure: string | null = null;
  created: string[] = [];
  toggled: { id: string; completed: boolean }[] = [];
  removed: string[] = [];
  wentToSignIn = false;

  async currentUser(): Promise<{ id: string; email: string }> {
    if (this.unauthorized) {
      throw new TodoRequestError('Sign in to continue.', 401);
    }
    return { id: '1', email: 'ada@example.com' };
  }

  async list(): Promise<Todo[]> {
    return this.items;
  }

  async create(title: string): Promise<Todo> {
    this.created.push(title);
    if (this.failure !== null) {
      throw new TodoRequestError(this.failure, 400);
    }
    return { id: 't3', title, completed: false, createdAt: '2026-10-01T00:00:02.000Z' };
  }

  async setCompleted(id: string, completed: boolean): Promise<Todo> {
    this.toggled.push({ id, completed });
    const current = this.items.find((todo) => todo.id === id) ?? milk;
    return { ...current, completed };
  }

  async remove(id: string): Promise<void> {
    this.removed.push(id);
  }

  logout(): Promise<void> {
    return Promise.resolve();
  }

  goToSignIn(): void {
    this.wentToSignIn = true;
  }
}

function field(root: ParentNode, label: string): DsInput {
  const match = [...root.querySelectorAll('ds-input')].find((item) => (item as DsInput).label === label);
  if (!(match instanceof HTMLElement)) {
    throw new Error(`missing ${label} field`);
  }
  return match as DsInput;
}

async function setValue(control: DsInput, value: string): Promise<void> {
  await control.updateComplete;
  const input = control.shadowRoot?.querySelector('input');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error(`missing ${control.label} input`);
  }
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  await control.updateComplete;
}

async function clickAdd(root: ParentNode): Promise<void> {
  const button = root.querySelector('form ds-button') as DsButton | null;
  if (button === null) {
    throw new Error('missing add button');
  }
  await button.updateComplete;
  button.shadowRoot?.querySelector('button')?.click();
  await button.updateComplete;
}

describe('todos page', () => {
  let fixture: ComponentFixture<TodosPage>;
  let todos: FakeTodoClient;

  beforeEach(async () => {
    todos = new FakeTodoClient();
    await TestBed.configureTestingModule({
      imports: [TodosPage],
      providers: [{ provide: TodoClient, useValue: todos }],
    }).compileComponents();
    fixture = TestBed.createComponent(TodosPage);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('sends a signed-out visitor to sign in', async () => {
    todos.unauthorized = true;
    fixture = TestBed.createComponent(TodosPage);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(todos.wentToSignIn).toBe(true);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  it('shows the saved todos and filters them', async () => {
    expect(fixture.nativeElement.textContent).toContain('Buy milk');
    expect(fixture.nativeElement.textContent).toContain('Buy bread');

    fixture.componentInstance.filter.setValue('active');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Buy milk');
    expect(fixture.nativeElement.textContent).not.toContain('Buy bread');

    fixture.componentInstance.filter.setValue('completed');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).not.toContain('Buy milk');
    expect(fixture.nativeElement.textContent).toContain('Buy bread');
  });

  it('keeps an empty title on the page', async () => {
    await clickAdd(fixture.nativeElement);
    const title = field(fixture.nativeElement, 'New todo');
    await title.updateComplete;

    expect(todos.created).toEqual([]);
    expect(title.shadowRoot?.querySelector('.error')?.textContent).toBe('This field is required.');
  });

  it('adds, completes, and deletes a todo', async () => {
    const title = field(fixture.nativeElement, 'New todo');
    await setValue(title, 'Walk the dog');
    await clickAdd(fixture.nativeElement);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(todos.created).toEqual(['Walk the dog']);
    expect(fixture.nativeElement.textContent).toContain('Walk the dog');

    const row = [...fixture.nativeElement.querySelectorAll('.todo')].find((item) =>
      item.textContent?.includes('Buy milk'),
    );
    if (!(row instanceof HTMLElement)) {
      throw new Error('missing milk row');
    }
    row.querySelector('input')?.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    fixture.detectChanges();
    expect(todos.toggled).toEqual([{ id: 't1', completed: true }]);
    expect(row.querySelector('.done')?.textContent).toBe('Buy milk');

    const remove = row.querySelector('ds-button') as DsButton | null;
    await remove?.updateComplete;
    remove?.shadowRoot?.querySelector('button')?.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(todos.removed).toEqual(['t1']);
    expect(fixture.nativeElement.textContent).not.toContain('Buy milk');
  });

  it('shows an API title message on the field', async () => {
    todos.failure = 'Use at most 200 characters.';
    const title = field(fixture.nativeElement, 'New todo');
    await setValue(title, 'x'.repeat(201));
    await clickAdd(fixture.nativeElement);
    await fixture.whenStable();
    await title.updateComplete;

    expect(title.shadowRoot?.querySelector('.error')?.textContent).toBe('Use at most 200 characters.');
  });
});
