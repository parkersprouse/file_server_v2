# Web File Browser — Codebase Analysis

A deep review of the **server** (Rust / actix-web) and **client** (Vue 3 / Vite)
packages, covering security, performance, correctness, and general
improvements. Findings are ordered by severity within each section, and each
item lists the relevant file(s) and a concrete recommendation.

> **Architecture in one paragraph:** the server exposes a single catch-all
> `GET /{path:.*}` route. A request maps a URL path to a filesystem path under
> a configured `root_dir`. Directories are returned as JSON entry listings;
> files are streamed back with a content disposition. Access is gated only by
> the caller's source IP. The client is a Vue 3 SPA that renders directory
> listings, supports sorting/views, and previews media/text/documents in a
> modal. There is **no authentication, no write path, and no database** — it is
> a read-only browser over a directory tree.

---

## 1. Server — Security

### 1.1 (High) No authentication; access control is a source-IP prefix check
`server/src/lib/gatekeeper.rs`

```rust
static VALID_ADDRS: [&str; 2] = ["127.0.0.1", "192.168."];
match ctx.head().peer_addr { Some(addr) => VALID_ADDRS.iter().any(|e| addr.to_string().starts_with(e)) ... }
```

The only thing standing between a request and the filesystem is whether the
TCP peer address string starts with `127.0.0.1` or `192.168.`. Problems:

- **Reverse-proxy bypass.** If the server is fronted by nginx/Caddy/Traefik (a
  very common deployment), `peer_addr` is the proxy — almost always
  `127.0.0.1` — so **every** external client is treated as trusted. The whole
  file tree becomes public.
- **Incomplete private ranges.** `10.0.0.0/8` and `172.16.0.0/12` (Docker's
  default bridge networks!) are not covered, so legitimate LAN/container
  clients are blocked while the model is still not actually a security
  boundary.
- **No IPv6.** `::1` (IPv6 localhost) and IPv6 ULAs never match.
- **String prefix matching is brittle.** Matching on `addr.to_string()`
  (which includes the port) rather than parsing into `IpAddr` and comparing
  against real CIDR ranges is fragile.

**Recommendation:** Treat IP filtering as a convenience, not a security
control. Add real authentication if the server is ever exposed (a shared
token / basic-auth / reverse-proxy auth). For the IP allowlist itself, parse
`IpAddr` and test against configurable CIDR ranges (e.g. via the `ipnet`
crate), include loopback v6 and the other RFC1918 ranges, and **never** trust
`X-Forwarded-For` unless a trusted-proxy list is configured.

### 1.2 (High) Symlinks can escape the root directory
`server/src/util.rs` (`validate_path`)

`validate_path` builds `"{root_dir}/{pathname}"` and checks for `../`, but it
**never canonicalizes** the final path. A symlink anywhere inside `root_dir`
that points outside it (e.g. `root/link -> /etc`) lets a client read arbitrary
files via `GET /link/passwd`. `fs::exists`, `fs::metadata`, and `NamedFile`
all follow symlinks.

**Recommendation:** After building the candidate path, call
`std::fs::canonicalize` (or `tokio::fs::canonicalize`) and verify the result
still `starts_with` the canonicalized `root_dir`. Reject otherwise. This also
hardens the traversal check below.

### 1.3 (Medium) Path is URL-decoded twice; traversal check relies on string matching
`server/src/util.rs`

actix already percent-decodes path captures, and `validate_path` then calls
`urlencoding::decode` **again** on the captured `path`. Two issues:

- **Double-decode is an anti-pattern.** While the current `../` check happens
  *after* both decodes (so basic traversal is still blocked), double-decoding
  is exactly the class of bug that defeats naive traversal filters. It also
  corrupts legitimate filenames containing `%` (e.g. `100%done.txt`), which
  can decode-fail and return a 500.
- **Substring matching is weak.** `format!("/{pathname}/").contains("/../")`
  is a denylist. Canonicalization (1.2) is the robust fix; the string check
  should be a secondary defense, not the primary one.

**Recommendation:** Decode exactly once, rely on `canonicalize` + `starts_with`
as the authoritative check, and keep the `../` rejection only as defense in
depth.

### 1.4 (Medium) Permissive CORS + no auth enables DNS-rebinding / drive-by file reads
`server/src/lib/cors.rs`

```rust
Cors::default().allow_any_origin().allowed_methods(vec!["GET"])
```

`allow_any_origin()` means any website a LAN user visits can read JSON
directory listings and file contents cross-origin (responses are readable
because there are no credentials and origin is wildcarded). Combined with the
IP-only gate, a malicious page using **DNS rebinding** can reach the server as
if it were local and exfiltrate the user's files.

**Recommendation:** Restrict allowed origins to the known client origin(s)
from config instead of `allow_any_origin()`. Consider a `Host`-header
allowlist to blunt DNS rebinding.

### 1.5 (Low) Blocked requests return 404 instead of 403, and errors leak paths into logs
`server/src/main.rs`, `server/src/lib/error.rs`

Because the gatekeeper is a route `guard`, a rejected request simply fails to
match and returns the default 404 — harmless but confusing for debugging.
Separately, `InvalidPath`/`NotFound` log the full offending path at `error`
level (`error!("{}", self)`); high-volume scanning could flood logs (log
amplification) and the messages disclose internal paths.

**Recommendation:** Optionally return an explicit 403 for gate failures; log
rejected/invalid paths at `warn`/`debug`, not `error`.

---

## 2. Server — Performance

### 2.1 (High) Blocking filesystem & subprocess work runs on the async executor — ✅ Resolved
`server/src/services/read_dir.rs`, `server/src/structs/entry_details.rs`,
`server/src/services/read_file.rs`

> **✅ Resolved (2026-06-25):** `read_dir::read` now enumerates the directory
> inside `web::block` (the blocking `read_dir`/`metadata`/thumbnail `stat`s),
> then resolves each entry's header sniff and `ffprobe` concurrently via a
> `futures` stream bounded with `buffered(8)`. Both `FileFormat::from_file` and
> `ffprobe::ffprobe` are wrapped in `web::block`, so no blocking filesystem or
> subprocess work runs on the async executor.

The request handlers are `async`, but the heavy work is **synchronous and
blocking**, executed directly on the actix/tokio worker threads:

- `std::fs::read_dir`, `std::fs::metadata`, `fs::exists` (sync I/O).
- `FileFormat::from_file(path)` — opens and reads the header of **every** file
  in a directory to sniff its type.
- `ffprobe::ffprobe(path)` — spawns an external `ffprobe` **subprocess** per
  audio/video file, synchronously, and waits for it.

A single listing of a media-heavy directory therefore blocks a worker thread
while it sequentially spawns N ffprobe processes and reads N file headers,
starving other requests on that thread.

**Recommendation:** Move the per-directory work into
`actix_web::web::block` / `tokio::task::spawn_blocking`, and run the per-entry
metadata/format/duration work concurrently (e.g. `futures::stream` with
bounded concurrency) rather than in a sequential `for` loop. Use an async
ffprobe wrapper or cap concurrent subprocesses with a semaphore.

### 2.2 (Medium) Directory listing does O(N) header reads + ffprobe on every cold load — 🟡 Partially addressed
`server/src/structs/entry_details.rs` (`new`, `determine_file_format`,
`determine_duration`)

> **🟡 Partially addressed (2026-06-25):** the cold-load cost is now paid
> concurrently (≤8 entries in flight) rather than sequentially, and listings are
> cached behind an `Arc` so repeat visits are a pointer clone. The remaining
> recommendations — deferring expensive metadata to a lazy/on-demand endpoint,
> persisting the media cache across restarts, and a longer/invalidation-based
> TTL — were **not** implemented and remain open.

Even ignoring the blocking concern, every cold directory load reads each
file's header and probes each media file's duration. For large directories
this is slow and I/O-heavy. The media cache helps on *repeat* visits but the
first load of any directory pays full cost, and the directory cache's 5-minute
TTL means it is re-paid regularly.

**Recommendation:** Defer expensive metadata (duration, precise type) to a
lazy/on-demand endpoint or compute it only for the entries actually shown;
persist the media cache across restarts; consider a longer or invalidation-based TTL.

### 2.3 (Medium) Caches are unbounded and never proactively evicted — ✅ Resolved
`server/src/lib/cache.rs`, `server/src/lib/media_cache.rs`

> **✅ Resolved (2026-06-25):** both caches were replaced with
> `moka::future::Cache`, which enforces a bounded `max_capacity` (1024 directory
> listings / 8192 media entries) with LRU eviction plus TTL. Memory can no
> longer grow without bound, and the hand-rolled `HashMap`/`RwLock` code was
> removed.

Both caches are `HashMap`s that only remove an entry when that exact key is
requested again *after* it expired. Keys that are never revisited live
forever. Over a long-running process that browses many directories, memory
grows without bound. There is no max-size or LRU bound and no background
sweeper (the `cleanup`-style logic exists only on the client).

**Recommendation:** Add a max entry count with LRU/LFU eviction (e.g.
`moka` or `lru`), or run a periodic sweep task. `moka` would also give you
async-aware TTL + size bounds and remove most of this hand-rolled code.

### 2.4 (Medium) Cache `get()` takes a write lock on every miss; full `Vec` clones on every hit — ✅ Resolved
`server/src/lib/cache.rs`, `server/src/lib/media_cache.rs`

> **✅ Resolved (2026-06-25):** the `moka` switch (2.3) shards locking
> internally, so a miss no longer takes a global write lock to remove a
> non-existent key. Directory listings are stored as `Arc<Vec<EntryDetails>>`,
> so a hit returns a cheap `Arc::clone` instead of deep-copying the vector
> (`read_dir::read` now returns the `Arc`, serialized via `.json(result.as_ref())`).

```rust
pub async fn get(&self, path: &str) -> Option<Vec<EntryDetails>> {
  let cache = self.cache.read().await;
  if let Some(entry) = cache.get(path) && !entry.is_expired() { return Some(entry.data.clone()); }
  drop(cache);
  let mut cache = self.cache.write().await;  // taken even for keys that were never cached
  cache.remove(path);
  None
}
```

- Every **miss** — including brand-new keys that were never present —
  acquires the write lock to `remove` a non-existent key, serializing
  concurrent first-time loads.
- Every **hit** `.clone()`s the entire `Vec<EntryDetails>` (and on `set` the
  caller clones again). For large directories this is a substantial copy per
  request.

**Recommendation:** Only take the write lock when an *expired* entry was
actually found. Store `Arc<Vec<EntryDetails>>` so hits hand back a cheap
`Arc::clone` instead of a deep copy.

### 2.5 (Low) Redundant `stat` / header reads on the file path — ✅ Resolved
`server/src/services/resource_handler.rs`, `server/src/services/read_file.rs`

> **✅ Resolved (2026-06-25):** `validate_path` now performs a single
> `fs::metadata` (replacing its `fs::exists`) and returns the `Metadata`, which
> the resource handler reuses and threads into `read_file::read` — so a file
> request is `stat`ed once rather than three times, and per-entry metadata is
> read once during enumeration (was twice). One residual is left intentionally:
> the `Auto` file-serve still sniffs the header once rather than reusing the
> listing's already-computed type, since wiring that to a possibly-cold
> directory-cache lookup would be fragile for a one-read-per-view cost.

For a file request the path is `stat`ed in `validate_path` (`fs::exists`),
again in `resource_handler` (`fs::metadata`), and a third time inside
`read_file::read` for the `Auto` disposition — plus `FileFormat::from_file`
re-reads the header that was already read during listing.

**Recommendation:** Thread the already-obtained `Metadata` through, and reuse
the file-type determination rather than recomputing it.

---

## 3. Server — Correctness & Robustness

### 3.1 (High) Panics on non-UTF-8 filenames and metadata errors — ✅ Resolved
`server/src/structs/entry_details.rs` (`EntryDetails::new`)

> **✅ Resolved (2026-06-25):** entry construction was split into
> `enumerate_dir` + `from_raw` (during the 2.1 refactor); metadata is now read
> once and entries whose metadata can't be read are skipped instead of
> `unwrap()`-panicking, and the filename uses `to_string_lossy()` rather than
> `into_string().unwrap()`. The remaining request-path `unwrap()`s on
> `file_format` (`file_type`/`full_type`) were rewritten to `match`/`let else`,
> so they can't panic.

```rust
let metadata: fs::Metadata = entry.metadata().unwrap();
...
let name: String = entry.file_name().into_string().unwrap();
```

On Linux, filenames are arbitrary bytes and need not be valid UTF-8.
`into_string().unwrap()` **panics** on any non-UTF-8 name, and
`entry.metadata().unwrap()` panics on a broken symlink or permission error.
A single such entry crashes the whole directory request (500), making the
directory unbrowsable.

**Recommendation:** Use `to_string_lossy()` for the name and handle the
`metadata`/format errors gracefully (skip the entry or mark it as
unreadable). Audit all `unwrap()`s in request paths.

### 3.2 (Medium) `str::replace` used for prefix stripping — ✅ Resolved
`server/src/structs/entry_details.rs` (`path_to_url`), `entry_type.rs`
(`valid`)

> **✅ Resolved (2026-06-25):** both `path_to_url` and `EntryType::valid` now
> use `Path::strip_prefix(root_dir_path)`, which removes only the leading root
> prefix on path-component boundaries instead of substring-replacing every
> occurrence of the root string. Non-UTF-8 paths fall back to the unmodified
> path rather than collapsing to `""`.

```rust
path.to_str().unwrap_or("").replace(&data.config.root_dir_path, "")
```

`replace` removes **every** occurrence of the root path string, not just the
leading prefix. If the root path string happens to appear again later in a
descendant path, the URL is mangled. It also silently drops non-UTF-8 paths to
`""`.

**Recommendation:** Use `Path::strip_prefix(root_dir)` for correct,
prefix-only removal.

### 3.3 (Low) Dead / non-compiling code committed — ✅ Resolved
`server/src/services/read_dir.v2.rs`

> **✅ Resolved (2026-06-25):** the file was deleted. The commented-out
> server-side-sorting reference implementation remains available in git history.

This file is not declared in `main.rs`'s module tree (so it is not compiled),
references structs that don't exist in the crate (`query_params`, `sort_dir`,
`sort_key`), contains an empty `match` with no return value, and ends with a
large commented-out block. It is confusing dead weight.

**Recommendation:** Either finish and wire up server-side sorting or delete the
file; keep the commented-out reference implementation in git history, not in
the tree.

### 3.4 (Low) Config & startup ergonomics — ✅ Resolved
`server/src/app_config.rs`

> **✅ Resolved (2026-06-25):** the file source is now `.required(false)`, so
> env-only configuration works without a (possibly empty) `config.toml` present
> (verified by booting the server from a directory with no config file). The
> build error message is clearer (`.expect("Failed to load configuration")`),
> the friendly "must set root_dir" panic is retained, and `parse_app_log_level`
> is now a single allocation-free `app_levels.get(level)` lookup.

- `.build().unwrap()` panics with an opaque message if `config.toml` is
  missing; the env-var fallback exists but the file source is not marked
  `required(false)`, so env-only configuration still requires a (possibly
  empty) file in some setups.
- `parse_app_log_level` clones the whole `HashMap` just to list its keys
  (`app_levels.clone().into_keys()`); a direct `app_levels.get(level)` with a
  default is simpler and allocation-free.

**Recommendation:** Mark the file source optional, surface a friendly error if
neither config source yields `root_dir`, and simplify the log-level lookup to a
single `get`.

### 3.5 (Low) Tooling / repo hygiene — ✅ Resolved

> **✅ Resolved (2026-06-25):** the local Make target was renamed to `serve`
> (matching its `.PHONY`) so `start` is no longer defined twice, and a stray
> `--filter name=livestream` in `status` was corrected. `docker-compose.yml` was
> rewritten to run out of the box: aligned port (`8100`), inline `environment`
> (replacing the missing `docker/local.env`), a read-only volume mount for the
> browse root, and the obsolete `version`/external-network removed. The
> `Dockerfile` now installs `ffmpeg`, and the `README` documents the runtime
> `ffprobe` dependency. (Note: the compose container is still subject to the
> source-IP gatekeeper from 1.1 — Docker bridge IPs aren't in its allowlist.)

- `server/Makefile` defines `start` twice (once aliased to `serve`/`cargo run`,
  once to `docker-compose up`) — the second silently wins.
- `server/docker-compose.yml` maps port `1234:1234` and references
  `docker/local.env`, but the app defaults to port `9000`/`8100` and the env
  file isn't in the repo — the compose setup won't work out of the box.
- `server/README.md` documents an external `metadata`/ffmpeg dependency but the
  code uses the `ffprobe` crate; the runtime dependency on a system `ffprobe`
  binary isn't called out (the Alpine `Dockerfile` doesn't install ffmpeg, so
  duration probing silently fails in the container).

**Recommendation:** De-duplicate the Make targets, fix/align the compose
ports + env file, and install `ffmpeg` in the Docker image (or document that
duration metadata requires it).

---

## 4. Client — Security

### 4.1 (Medium) SVG previews execute embedded scripts — ✅ Resolved
`client/src/components/directory_view/preview_dialog/file_viewers/ImagePreview.vue`,
`DocumentPreview.vue`

> **✅ Resolved (2026-06-25):** images (including SVGs) now render via `<img>`
> instead of `<object>` — an `<img>` does not execute `<script>` embedded in an
> SVG. Documents render in an `<iframe sandbox=''>` (all restrictions, including
> no script execution and no same-origin) instead of `<object>`, while the
> browser still renders PDFs/images natively. As defense in depth, the server
> now sends `X-Content-Type-Options: nosniff` on all responses
> (`server/src/main.rs`).

SVGs are rendered with `<object :data='entry.url' type='image/svg+xml'>`, and
documents/spreadsheets with `<object :data='entry.url'>`. An `<object>` loading
an SVG (or HTML) **executes embedded `<script>`** in the origin that served the
file (the server's origin). Because the file server has no auth/cookies the
blast radius is small today, but it is still arbitrary script execution
triggered by previewing a file, and it shares an origin with any future
authenticated functionality.

**Recommendation:** Render images via `<img>` (which does **not** run SVG
scripts) instead of `<object>`, or serve user files with a restrictive
`Content-Security-Policy` and `Content-Disposition: attachment` /
`X-Content-Type-Options: nosniff`. Sandbox document previews in an
`<iframe sandbox>` rather than `<object>`.

### 4.2 (Low) Text preview is fetched and highlighted client-side — verify escaping — ✅ Resolved
`client/src/components/.../file_viewers/TextPreview.vue`

> **✅ Resolved (2026-06-25):** verified Prism's `fileHighlight` tokenizes the
> fetched text into the DOM (it does not inject raw HTML), so the preview path
> escapes content. As the recommended hardening, text files are served as
> `text/plain` (already the case) **and** now carry `X-Content-Type-Options:
> nosniff` (added in `server/src/main.rs`), so a `.txt` containing HTML can't be
> sniffed into an executable type — verified against a live response.

Prism's `fileHighlight` plugin fetches the raw file (`data-src`) and injects it
into `<pre><code>`. Prism escapes text content, so this is generally safe, but
it depends entirely on Prism's escaping and the file being served with a
non-executable content type. Worth an explicit note/test.

**Recommendation:** Ensure text files are served with `nosniff` and a
`text/plain` (or otherwise non-renderable) content type so a `.txt` containing
HTML can never be sniffed into an executable type.

---

## 5. Client — Correctness

### 5.1 (Medium) `checkSupport` version-range comparison is inverted — ✅ Resolved
`client/src/lib/browser.ts`

> **✅ Resolved (2026-06-25):** the ranged-stats check is now the intended
> inclusive interval `Number(lower) <= details.version && details.version <= Number(higher)`.

```rust
if (Number(lower) < details.version && details.version > Number(higher)) { return true; }
```

The second clause should be `details.version < Number(higher)` to mean "within
`[lower, higher]`". As written it is `version > lower && version > higher`,
which is just `version > higher` — so the range check never matches the
intended interval and feature detection for ranged browser stats is broken.

**Recommendation:** `Number(lower) <= details.version && details.version <= Number(higher)`.

### 5.2 (Low) Backslash path fix only replaces the first occurrence — ✅ Resolved
`client/src/stores/router.ts`

> **✅ Resolved (2026-06-25):** the fix now uses a global regex
> (`to.path.replace(/%5C/g, '//')`) so every encoded backslash is rewritten, not
> just the first, with a comment explaining the Windows-path intent. A global
> regex is used in preference to `replaceAll` to stay within the `since 2018`
> browserslist / `es2020` build target.

```ts
const should_update = path.includes('%5C');
if (should_update) to.path = to.path.replace('%5C', '//');
```

`String.replace` with a string argument replaces only the **first** match, so a
path with multiple encoded backslashes is only partially fixed.

**Recommendation:** Use `replaceAll('%5C', '//')` (or a global regex), and add a
comment explaining the Windows-path intent.

### 5.3 (Low) `toFileUrl` percent-encodes path separators — ✅ Resolved
`client/src/lib/utils.ts`

> **✅ Resolved (2026-06-25):** the path is now split on `/`, each segment
> `encodeURIComponent`-encoded, and re-joined with `/`, so separators stay as
> `/` instead of becoming `%2F`.

```ts
return `${http.defaults.baseURL!}/${encodeURIComponent(trim(path))}`;
```

`encodeURIComponent` encodes `/` as `%2F`, so a nested path becomes
`a%2Fb%2Fc.png`. Many servers (and actix by default) reject or refuse to decode
`%2F` inside a path segment, which can break previews/downloads of nested
files. The server's double-decode (3.1/1.3) may currently paper over this, but
it is fragile.

**Recommendation:** Encode each path **segment** separately and re-join with
`/`, or use `encodeURI` for the path portion.

### 5.4 (Low) `RequestCache.setPending` stores `undefined` as `T` — ✅ Resolved
`client/src/lib/request_cache.ts`

> **✅ Resolved (2026-06-25):** `CacheEntry.data` is now optional (`data?: T`),
> the `as T` cast in `setPending` is gone, and `get()` returns `null` (via
> `entry.data ?? null`) for a pending-only entry instead of handing back
> `undefined` typed as a valid `T`.

```ts
this.cache.set(key, { data: existing?.data as T, promise, timestamp: ... });
```

When no entry exists yet, `data` is `undefined` cast to `T`, so a concurrent
`get()` during the in-flight window returns `undefined` typed as a valid
result. Callers happen to treat it as falsy, but the type lies.

**Recommendation:** Make `CacheEntry.data` optional (`data?: T`) and have
`get()` return `null` when `data` is absent, so the types reflect reality.

---

## 6. Client — Performance & General Improvements

### 6.1 (Low) `event_bus` wraps a module singleton in a `computed` — ✅ Resolved
`client/src/composables/event_bus.ts`

> **✅ Resolved (2026-06-25):** `useEventBus` now returns the module-level
> `Emittery` singleton directly; the `computed`/`get` wrapper (and their imports)
> were removed.

`useEventBus` creates a `computed` that just returns a module-level `Emittery`
instance and immediately unwraps it. The reactivity wrapper adds nothing.

**Recommendation:** Return the singleton directly.

### 6.2 (Low) `scroll_offset` map grows unbounded — ✅ Resolved
`client/src/stores/global.ts`, `client/src/views/DirectoryView.vue`

> **✅ Resolved (2026-06-25):** `scroll_offset` is now encapsulated behind
> `rememberScrollOffset`/`getScrollOffset` store methods (the raw ref is no
> longer exported). Writes cap the map at `MAX_SCROLL_OFFSETS` (50) entries,
> evicting the oldest (least-recently-used) keys, so it stays bounded over long
> sessions. `DirectoryView` calls the methods instead of mutating the map
> directly.

Scroll positions are stored per path forever. Long browsing sessions
accumulate entries indefinitely (minor, but trivially bounded).

**Recommendation:** Cap the map size or prune on navigation.

### 6.3 (Low) Vue Devtools plugin is always registered — ✅ Resolved
`client/vite.config.ts`

> **✅ Resolved (2026-06-25):** the config was converted to the function form
> and `VueDevtools(...)` is now spread in only when `command === 'serve'`, so it
> is never registered for production builds.

`VueDevtools({...})` is added unconditionally. The plugin disables itself in
production builds, but gating it behind `mode === 'development'` makes intent
explicit and avoids any chance of shipping the inspector hooks.

**Recommendation:** Add the plugin conditionally on the Vite `command`/`mode`.

### 6.4 (Positive) Things already done well
- **Virtualized lists** via `@tanstack/vue-virtual` in `ViewStack`/`ViewGrid`
  keep large directories fast to render.
- **Request deduplication + TTL cache** on the client avoids redundant fetches.
- **Lazy-loaded preview components and Prism** keep the initial bundle small;
  `manualChunks` splits vendors sensibly.
- **`AbortController`** cancels in-flight directory requests on navigation.
- Server uses `actix-files::NamedFile` (range requests, ETag, Last-Modified)
  for efficient downloads, and gzip/brotli compression is enabled.

---

## 7. Suggested Priority Order

| # | Area | Severity | Effort | Item |
|---|------|----------|--------|------|
| 1 | Server sec | High | Med | Canonicalize paths to block symlink escape (1.2) |
| 2 | Server sec | High | Med | Real auth; fix IP gate semantics & proxy bypass (1.1) |
| 3 | Server robustness | High | Low | ✅ Remove panicking `unwrap()`s on filenames/metadata (3.1) |
| 4 | Server perf | High | Med | ✅ Move blocking FS/ffprobe off the async executor (2.1) |
| 5 | Server sec | Med | Low | Lock down CORS to known origins (1.4) |
| 6 | Server perf | Med | Med | ✅ Bound/evict caches; `Arc` the cached vec; fix miss-locking (2.3, 2.4) |
| 7 | Client sec | Med | Low | ✅ Render images via `<img>`; sandbox/CSP document previews (4.1) |
| 8 | Client correctness | Med | Low | ✅ Fix inverted version-range check (5.1) |
| 9 | Server hygiene | Low | Low | ✅ Delete/finish `read_dir.v2.rs`; fix Make/compose/Docker ffmpeg (3.3, 3.5) |
| 10 | Client correctness | Low | Low | ✅ `replaceAll` backslash, per-segment URL encoding (5.2, 5.3) |
