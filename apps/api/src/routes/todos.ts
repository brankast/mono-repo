import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import type { AppOptions } from '../config.js';
import { deleteTodo, insertTodo, listTodos, updateTodo, type Database } from '../db.js';
import { HttpError, parseBody } from '../http.js';
import { requireUserId } from '../session.js';

const title = z
  .string({ error: 'Enter a title.' })
  .trim()
  .min(1, { error: 'Enter a title.' })
  .max(200, { error: 'Use at most 200 characters.' });

const createTodo = z.object({
  title,
});

const updateTodoBody = z
  .object({
    title: title.optional(),
    completed: z.boolean({ error: 'Completed must be true or false.' }).optional(),
  })
  .refine((value) => value.title !== undefined || value.completed !== undefined, {
    error: 'Nothing to update.',
  });

export function registerTodos(app: FastifyInstance, db: Database, options: AppOptions): void {
  app.get('/api/todos', async (request) => {
    const userId = await requireUserId(request, options.authSecret);
    return listTodos(db, userId);
  });

  app.post('/api/todos', async (request, reply) => {
    const userId = await requireUserId(request, options.authSecret);
    const body = parseBody(createTodo, request.body);
    return reply.code(201).send(insertTodo(db, userId, body.title));
  });

  app.patch<{ Params: { id: string } }>('/api/todos/:id', async (request) => {
    const userId = await requireUserId(request, options.authSecret);
    const body = parseBody(updateTodoBody, request.body);
    const todo = updateTodo(db, userId, request.params.id, body);
    if (todo === undefined) throw new HttpError(404, 'Todo not found.');
    return todo;
  });

  app.delete<{ Params: { id: string } }>('/api/todos/:id', async (request, reply) => {
    const userId = await requireUserId(request, options.authSecret);
    if (!deleteTodo(db, userId, request.params.id)) throw new HttpError(404, 'Todo not found.');
    return reply.code(204).send();
  });
}
