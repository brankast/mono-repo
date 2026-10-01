export type AppOptions = {
  databasePath: string;
  authSecret: string;
  secureCookie: boolean;
  passwordRounds: number;
  logger: boolean;
};

export type Config = AppOptions & {
  host: string;
  port: number;
};

export function readConfig(env: NodeJS.ProcessEnv): Config {
  const authSecret = env.AUTH_SECRET ?? '';
  if (authSecret.length < 32) {
    throw new Error('AUTH_SECRET must be at least 32 characters.');
  }

  return {
    host: env.HOST === undefined || env.HOST === '' ? '0.0.0.0' : env.HOST,
    port: readPort(env.PORT),
    databasePath: env.DATABASE_PATH === undefined || env.DATABASE_PATH === '' ? 'data/app.db' : env.DATABASE_PATH,
    authSecret,
    secureCookie: env.NODE_ENV === 'production',
    passwordRounds: 10,
    logger: true,
  };
}

function readPort(value: string | undefined): number {
  if (value === undefined || value === '') return 3000;
  const port = Number(value);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be an integer from 1 to 65535.');
  }
  return port;
}
