# mono-repo

pnpm workspace with Nx. Apps live in `apps/`, shared libraries in `libs/`.

Projects:

- `@mono/contracts` (`libs/contracts`) — shared API types. None yet.
- `@mono/design-system` (`libs/design-system`) — tokens and `ds-button`. Import `@mono/design-system/tokens.css` once per app.

```sh
pnpm install
pnpm nx show projects
```
