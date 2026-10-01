import cookie from '@fastify/cookie';
import Fastify, { type FastifyError } from 'fastify';
import type { AppOptions } from './config.js';
import { openDatabase } from './db.js';
import { HttpError } from './http.js';
import { registerAuth } from './routes/auth.js';
import { registerTodos } from './routes/todos.js';

export async function buildApp(options: AppOptions) {
  const db = openDatabase(options.databasePath);
  const app = Fastify({ logger: options.logger });
  app.addHook('onClose', async () => {
    db.close();
  });
  app.setErrorHandler((error: FastifyError | HttpError, request, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({ message: error.message });
    }
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      request.log.error(error);
      return reply.code(500).send({ message: 'Something went wrong.' });
    }
    return reply.code(statusCode).send({ message: error.message });
  });
  await app.register(cookie);
  registerAuth(app, db, options);
  registerTodos(app, db, options);
  return app;
}
