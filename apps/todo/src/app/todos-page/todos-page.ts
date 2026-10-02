import { ChangeDetectorRef, Component, ElementRef, inject, OnInit, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { DsButtonControl, DsInputControl, DsSelectControl } from '@mono/angular-ds';
import type { Todo } from '@mono/contracts';
import type { DsInput, SelectOption } from '@mono/design-system';
import { TodoClient, TodoRequestError } from '../todo-client';

type TodoFilter = 'all' | 'active' | 'completed';

@Component({
  selector: 'app-todos-page',
  imports: [ReactiveFormsModule, DsInputControl, DsButtonControl, DsSelectControl],
  templateUrl: './todos-page.html',
})
export class TodosPage implements OnInit {
  readonly filterOptions: SelectOption[] = [
    { value: 'all', label: 'All' },
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' },
  ];
  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
  });
  readonly filter = new FormControl<TodoFilter>('all', { nonNullable: true });
  items: Todo[] = [];
  ready = false;
  adding = false;
  loadError = '';
  formError = '';
  private readonly titleField = viewChild<ElementRef<DsInput>>('title');
  private readonly todos = inject(TodoClient);
  private readonly changes = inject(ChangeDetectorRef);

  constructor() {
    this.form.controls.title.valueChanges.subscribe(() => {
      const field = this.titleField()?.nativeElement;
      if (field !== undefined && field.error !== '') {
        field.error = '';
      }
      if (this.formError === '') {
        return;
      }
      this.formError = '';
      this.changes.detectChanges();
    });
    this.filter.valueChanges.subscribe(() => this.changes.detectChanges());
  }

  ngOnInit(): void {
    void this.load();
  }

  visible(): Todo[] {
    if (this.filter.value === 'active') {
      return this.items.filter((todo) => !todo.completed);
    }
    if (this.filter.value === 'completed') {
      return this.items.filter((todo) => todo.completed);
    }
    return this.items;
  }

  async add(event: Event): Promise<void> {
    const form = event.target;
    if (!(form instanceof HTMLFormElement) || !form.checkValidity() || this.adding) {
      return;
    }
    this.formError = '';
    this.adding = true;
    try {
      const todo = await this.todos.create(this.form.controls.title.value);
      this.items = [...this.items, todo];
      this.form.reset();
    } catch (error) {
      this.showActionError(error);
    } finally {
      this.adding = false;
      this.changes.detectChanges();
    }
  }

  async toggle(todo: Todo): Promise<void> {
    this.formError = '';
    try {
      const updated = await this.todos.setCompleted(todo.id, !todo.completed);
      this.items = this.items.map((item) => (item.id === updated.id ? updated : item));
    } catch (error) {
      this.showActionError(error);
    }
    this.changes.detectChanges();
  }

  async remove(todo: Todo): Promise<void> {
    this.formError = '';
    try {
      await this.todos.remove(todo.id);
      this.items = this.items.filter((item) => item.id !== todo.id);
    } catch (error) {
      this.showActionError(error);
    }
    this.changes.detectChanges();
  }

  private async load(): Promise<void> {
    try {
      await this.todos.currentUser();
      this.items = await this.todos.list();
      this.ready = true;
    } catch (error) {
      if (error instanceof TodoRequestError && error.status === 401) {
        this.todos.goToSignIn();
        return;
      }
      this.loadError = error instanceof TodoRequestError ? error.message : 'Something went wrong.';
    }
    this.changes.detectChanges();
  }

  private showActionError(error: unknown): void {
    if (error instanceof TodoRequestError && error.status === 401) {
      this.todos.goToSignIn();
      return;
    }
    const message = error instanceof TodoRequestError ? error.message : 'Something went wrong.';
    if (error instanceof TodoRequestError && error.status === 400) {
      const field = this.titleField()?.nativeElement;
      if (field !== undefined) {
        field.error = message;
        return;
      }
    }
    this.formError = message;
  }
}
