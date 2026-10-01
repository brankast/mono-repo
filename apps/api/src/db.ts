import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import type { Todo } from '@mono/contracts';

export type Database = DatabaseSync;

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
};

const migrations: { id: string; sql: string }[] = [
  {
    id: '001_init',
    sql: `
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE TABLE todos (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        completed INTEGER NOT NULL,
        created_at TEXT NOT NULL
      );
      CREATE INDEX todos_user_created ON todos (user_id, created_at);
    `,
  },
];

export function openDatabase(databasePath: string): Database {
  if (databasePath !== ':memory:') {
    mkdirSync(dirname(databasePath), { recursive: true });
  }
  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA foreign_keys = ON');
  if (databasePath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL');
  }
  migrate(db);
  return db;
}

function migrate(db: Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    )
  `);
  const applied = new Set(
    db
      .prepare('SELECT id FROM schema_migrations')
      .all()
      .map((row) => String(row.id)),
  );
  const insert = db.prepare('INSERT INTO schema_migrations (id, applied_at) VALUES (?, ?)');
  for (const migration of migrations) {
    if (applied.has(migration.id)) continue;
    db.exec('BEGIN');
    try {
      db.exec(migration.sql);
      insert.run(migration.id, new Date().toISOString());
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
}

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
};

export function insertUser(db: Database, email: string, passwordHash: string): UserRecord {
  const user: UserRecord = { id: randomUUID(), email, passwordHash };
  db.prepare('INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(
    user.id,
    user.email,
    user.passwordHash,
    new Date().toISOString(),
  );
  return user;
}

export function findUserByEmail(db: Database, email: string): UserRecord | undefined {
  const row = db.prepare('SELECT id, email, password_hash FROM users WHERE email = ?').get(email) as
    | UserRow
    | undefined;
  return row === undefined ? undefined : toUser(row);
}

export function findUserById(db: Database, id: string): UserRecord | undefined {
  const row = db.prepare('SELECT id, email, password_hash FROM users WHERE id = ?').get(id) as
    | UserRow
    | undefined;
  return row === undefined ? undefined : toUser(row);
}

function toUser(row: UserRow): UserRecord {
  return { id: row.id, email: row.email, passwordHash: row.password_hash };
}

type TodoRow = {
  id: string;
  title: string;
  completed: number;
  created_at: string;
};

export function listTodos(db: Database, userId: string): Todo[] {
  const rows = db
    .prepare(
      'SELECT id, title, completed, created_at FROM todos WHERE user_id = ? ORDER BY created_at ASC, id ASC',
    )
    .all(userId) as TodoRow[];
  return rows.map(toTodo);
}

export function insertTodo(db: Database, userId: string, title: string): Todo {
  const createdAt = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    'INSERT INTO todos (id, user_id, title, completed, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(id, userId, title, 0, createdAt);
  return { id, title, completed: false, createdAt };
}

export function updateTodo(
  db: Database,
  userId: string,
  id: string,
  patch: { title?: string; completed?: boolean },
): Todo | undefined {
  const result = db
    .prepare(
      `UPDATE todos
       SET title = CASE WHEN ? IS NULL THEN title ELSE ? END,
           completed = CASE WHEN ? IS NULL THEN completed ELSE ? END
       WHERE id = ? AND user_id = ?`,
    )
    .run(
      patch.title ?? null,
      patch.title ?? null,
      patch.completed === undefined ? null : patch.completed ? 1 : 0,
      patch.completed === undefined ? null : patch.completed ? 1 : 0,
      id,
      userId,
    );
  if (result.changes === 0) return undefined;
  const row = db
    .prepare('SELECT id, title, completed, created_at FROM todos WHERE id = ? AND user_id = ?')
    .get(id, userId) as TodoRow | undefined;
  return row === undefined ? undefined : toTodo(row);
}

export function deleteTodo(db: Database, userId: string, id: string): boolean {
  const result = db.prepare('DELETE FROM todos WHERE id = ? AND user_id = ?').run(id, userId);
  return result.changes === 1;
}

function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    completed: Number(row.completed) === 1,
    createdAt: row.created_at,
  };
}
