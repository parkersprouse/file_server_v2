# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A read-only web file browser. A **Rust / actix-web** server (`server/`) maps URL paths to a configured root directory and returns directory listings as JSON or streams files; a **Vue 3 / Vite** SPA (`client/`) renders the listings and previews media/text/documents in a modal. There is no authentication, no write path, and no database.

The two packages are built and served **independently** and run on **different ports** (so the client talks to the server cross-origin). The root `package.json` only orchestrates both with `concurrently`.

## Toolchain

- Node **24.18.0** (`.nvmrc`), pnpm **11.9.0** (pinned via `packageManager`; `corepack` will switch automatically). Client `engines` require node `^24` / pnpm `^11`.
- Client: Vite **8** (Rolldown bundler), TypeScript **6**, Vue 3 (`<script setup>`), Pinia, vue-router 5, Tailwind v4, shadcn-vue, ESLint **10** (flat config), Stylelint **17**.
- Server: Rust **edition 2024**, actix-web 4, `moka` caches, `ipnet`. Duration probing shells out to a system **`ffprobe`** binary (part of ffmpeg); it is skipped gracefully if absent.

## Commands

Run from the repo root unless noted.

```sh
pnpm start              # dev: client (vite --host) + server (cargo run) together
pnpm run client:dev     # dev: client only
pnpm run server:dev     # dev: server only (cargo run)
pnpm run release        # prod: build client + `serve` on :8080, server in release
```

Client (run inside `client/`):

```sh
pnpm dev                # vite dev server
pnpm build              # runs `check` (vue-tsc typecheck) + production build IN PARALLEL — type errors fail the build
pnpm run check          # vue-tsc typecheck only (use this for a fast type check)
pnpm run lint           # stylelint + eslint
pnpm run lint:js        # eslint only      (lint:css for stylelint only)
pnpm run lint:fix       # autofix both
pnpm exec eslint <file> # lint a single file
```

Server (run inside `server/`): `cargo run` / `cargo run -r`, `cargo build`, `cargo clippy`, `cargo fmt --check`. The `Makefile` adds `make serve` (= cargo run) and Docker targets (`make build`/`start`/`stop`/`logs`/`shell`).

**There are no test suites** in either package — no `test` script and no Rust `#[test]`s. Verify changes by typecheck/clippy/build and by running the server against a temp directory (`WEB_FILE_BROWSER_ROOT_DIR=/tmp/x WEB_FILE_BROWSER_PORT=8123 cargo run`, then curl it from `127.0.0.1`, which the default IP gate allows).

## Server architecture (request flow)

A single catch-all `GET /{path:.*}` route (`main.rs`) → `index_route` → `resource_handler::handle`. Key collaborators:

- **Access control runs in the handler, not as a route guard** (so a blocked request returns an explicit 403, not a 404): `gatekeeper::verify` (source-IP CIDR allowlist) then `cors::host_allowed` (Host-header / DNS-rebinding guard). CORS itself is built by `cors::build`; `nosniff` + `Content-Security-Policy: script-src 'none'` are added as a global `DefaultHeaders` middleware.
- `util::validate_path` decodes the **raw** request URI exactly once, then `fs::canonicalize`s the path and requires it to stay within `config.root_dir_canonical` — this is the authoritative symlink-escape / traversal guard. It returns `(PathBuf, Metadata)` so the path is `stat`ed once.
- **Directory** → `read_dir::read`: serves from `DirectoryCache` (moka, stores `Arc<Vec<EntryDetails>>`) on a hit; on a miss it enumerates the dir off the async executor via `web::block` (`EntryDetails::enumerate_dir`), then builds each entry's file-format + ffprobe duration **concurrently and bounded** via a `futures` stream over `EntryDetails::from_raw`. The blocking FS / ffprobe work must stay inside `web::block`.
- **File** → `read_file::read`: actix-files `NamedFile`; inline vs attachment chosen by `?download`/`?inline` query or the sniffed file type.
- `AppConfig` (`app_config.rs`) is loaded from `config.toml` (optional — `required(false)`) plus `WEB_FILE_BROWSER_*` env vars (list values are comma-separated). It canonicalizes the root and holds `allowed_cidrs` / `allowed_origins` / `allowed_hosts` (each defaults to local/private ranges when unset). Two `moka` caches live in `AppState`: directory listings (5 min TTL) and media durations (1 h TTL).

## Client architecture

- One catch-all route `/:pathMatch(.*)*` → `DirectoryView`. The current path IS the directory being browsed.
- API access is via a single axios instance (`lib/http.ts`) whose base URL is `${location.protocol}//${location.hostname}:${config.server_port}` — `config` comes from `client/src/config.toml` (imported through `vite-plugin-toml`). This is why client and server share a hostname but differ by port.
- Two Pinia stores: `stores/global.ts` (preview/UI state, scroll-offset memory) and `stores/router.ts` (sort/view state encoded in query params, plus before/after navigation callbacks).
- Cross-component signaling uses an **`emittery` event bus** (`composables/event_bus.ts`, a module singleton). With emittery 2, listeners receive `{ name, data }` — destructure `data`, e.g. `$event_bus.on('show_dialog', ({ data }) => ...)`.
- Directory rows are **virtualized** (`@tanstack/vue-virtual`) in `ViewStack`/`ViewGrid`. Previews are lazy-loaded per type under `preview_dialog/file_viewers/` (image via `<img>`, document via plain `<iframe>` protected by the server CSP, text highlighted by lazily-loaded Prism). `lib/request_cache.ts` deduplicates in-flight requests and TTL-caches results.

### Conventions

- Imports use bare path aliases (`@` → `src`, plus `assets`/`components`/`composables`/`enums`/`lib`/`stores`/`types`/`ui`/`utils`/`views`). These are defined in **both** `vite.config.ts` (`resolve.alias`) and `tsconfig.app.json` (`paths`) — keep the two in sync when adding one.
- Vite 8 / Rolldown rejects the object form of `rollupOptions.output.manualChunks`; it must be the **function** form (see `vite.config.ts`).
- pnpm 11 native-build approvals are declared in `client/pnpm-workspace.yaml` under `allowBuilds` (not interactive approval).
- `ANALYSIS_RESULTS.md` is a tracked security/performance review with per-item resolution status (✅ / 🟡). When you address one of its findings, update its marker and callout.
