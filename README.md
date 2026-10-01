# mono-repo

pnpm workspace with Nx. Apps live in `apps/`, shared libraries in `libs/`.

Projects:

- `@mono/contracts` (`libs/contracts`) — shared API types for users, todos, and auth requests. `passwordMinLength` is 8.
- `@mono/design-system` (`libs/design-system`) — tokens, `ds-button`, `ds-input`, and `ds-select`. Import `@mono/design-system/tokens.css` once per app.
- `@mono/angular-ds` (`libs/angular-ds`) — Angular directives so those elements work in a reactive form. Import `DsInputControl`, `DsSelectControl`, and `DsButtonControl`.
- `@mono/api` (`apps/api`) — auth and todos. Session is an httpOnly cookie named `session`.
- `@mono/sign-in` (`apps/sign-in`) — sign-in and register forms. Open `http://127.0.0.1:4200/sign-in/`.

```sh
pnpm install
pnpm nx show projects
pnpm --filter @mono/design-system demo
pnpm --filter @mono/api test
pnpm --filter @mono/sign-in test
pnpm --filter @mono/sign-in start
```

Copy `apps/api/.env.example` to `apps/api/.env`, set `AUTH_SECRET` to at least 32 characters, then run `pnpm --filter @mono/api dev`. The API listens on port 3000.
