import { Routes } from '@angular/router';
import { TodosPage } from './todos-page';

export const routes: Routes = [{ path: '', pathMatch: 'full', title: 'Todos', component: TodosPage }];
