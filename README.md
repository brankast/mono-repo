# mono-repo

pnpm workspace with Nx. Apps live in `apps/`, shared libraries in `libs/`.

Projects:

- `@mono/contracts` (`libs/contracts`) — shared API types for users, todos, and auth requests. `passwordMinLength` is 8.
- `@mono/design-system` (`libs/design-system`) — tokens, `ds-button`, `ds-input`, and `ds-select`. Import `@mono/design-system/tokens.css` once per app.
- `@mono/angular-ds` (`libs/angular-ds`) — Angular directives so those elements work in a reactive form. Import `DsInputControl`, `DsSelectControl`, and `DsButtonControl`.
- `@mono/api` (`apps/api`) — auth and todos. Session is an httpOnly cookie named `session`.
- `@mono/sign-in` (`apps/sign-in`) — sign-in and register forms. Open `http://127.0.0.1:4200/sign-in/`. The dev server proxies `/api` to port 3000 and `/todo` to port 4201, so a successful register or sign-in opens the todo app.
- `@mono/todo` (`apps/todo`) — the signed-in user's todos. Open `http://127.0.0.1:4201/todo/`. The dev server proxies `/api` to port 3000 and `/sign-in` to port 4200. Sign out ends the session.

```sh
pnpm install
pnpm nx show projects
pnpm --filter @mono/design-system demo
pnpm --filter @mono/api test
pnpm --filter @mono/sign-in test
pnpm --filter @mono/sign-in start
pnpm --filter @mono/todo test
pnpm --filter @mono/todo start
```

Copy `apps/api/.env.example` to `apps/api/.env`, set `AUTH_SECRET` to at least 32 characters, then run `pnpm --filter @mono/api dev`. The API listens on port 3000.
