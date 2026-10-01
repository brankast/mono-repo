export const passwordMinLength = 8;

export type HealthResponse = {
  ok: true;
};

export type User = {
  id: string;
  email: string;
};

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
};

export type RegisterRequest = {
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type CreateTodoRequest = {
  title: string;
};

export type UpdateTodoRequest = {
  title?: string;
  completed?: boolean;
};

export type ErrorResponse = {
  message: string;
};
