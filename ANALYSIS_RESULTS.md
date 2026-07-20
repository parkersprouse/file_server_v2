# Web File Browser — Codebase Analysis

A living review of the **server** (Rust / actix-web) and **client** (Vue 3 / Vite)
packages, covering security, performance, correctness, and general
improvements. Findings are ordered by severity within each section, and each
item lists the relevant file(s) and a concrete recommendation. Item numbers are
stable across revisions; fully-resolved items are collapsed into the history
table below (their full write-ups remain in git history).

> **Architecture in one paragraph:** the server exposes a single catch-all
> `GET /{path:.*}` route. A request maps a URL path to a filesystem path under
> a configured `root_dir`. Directories are returned as JSON entry listings;
> files are streamed back with a content disposition. Access is gated only by
> the caller's source IP. The client is a Vue 3 SPA that renders directory
> listings, supports sorting/views, and previews media/text/documents in a
> modal. There is **no authentication, no write path, and no database** — it is
> a read-only browser over a directory tree.

---

## Resolved findings — history

Collapsed summaries of items fully resolved in earlier passes. Full analysis
text for each is in git history.

| # | Severity | Item | Resolution |
|---|----------|------|------------|
| 1.2 | High | Symlinks could escape the root directory | ✅ 2026-06-25 — root canonicalized at startup; `validate_path` canonicalizes and requires `starts_with(root_dir_canonical)` |
| 1.3 | Medium | Path URL-decoded twice; traversal check was string matching | ✅ 2026-06-25 — raw URI decoded exactly once; canonicalize is the authoritative guard, `/../` check kept as defense in depth |
| 1.4 | Medium | `allow_any_origin()` CORS enabled DNS-rebinding / drive-by reads | ✅ 2026-06-25 — exact-origin (or local-only) CORS via `cors::build`; `Host`-header allowlist (`cors::host_allowed`) blunts rebinding |
| 1.5 | Low | Gate failures returned 404; errors logged paths at `error` level | ✅ 2026-06-25 — gate moved into the handler (explicit 403); `InvalidPath`→`warn`, `NotFound`→`debug` |
| 2.1 | High | Blocking FS & ffprobe work ran on the async executor | ✅ 2026-06-25 — enumeration in `web::block`; per-entry sniff/ffprobe concurrent via `buffered(8)` stream |
| 2.3 | Medium | Caches unbounded, never proactively evicted | ✅ 2026-06-25 — `moka` caches with `max_capacity` (1024 / 8192) + TTL |
| 2.4 | Medium | Cache miss took a write lock; hits deep-copied the `Vec` | ✅ 2026-06-25 — `moka` shards locking; listings stored as `Arc<Vec<EntryDetails>>` |
| 2.5 | Low | Redundant `stat`s / header reads on the file path | ✅ 2026-06-25 — single `fs::metadata` in `validate_path`, threaded through |
| 3.1 | High | Panics on non-UTF-8 filenames / metadata errors | ✅ 2026-06-25 — `to_string_lossy`, unreadable entries skipped, request-path `unwrap()`s removed |
| 3.2 | Medium | `str::replace` used for root-prefix stripping | ✅ 2026-06-25 — `Path::strip_prefix` on component boundaries |
| 3.3 | Low | Dead, non-compiling `read_dir.v2.rs` committed | ✅ 2026-06-25 — deleted |
| 3.4 | Low | Config file required even for env-only setups; clunky log-level lookup | ✅ 2026-06-25 — file source `.required(false)`; friendlier errors |
| 3.5 | Low | Makefile double `start`, broken compose, Docker missing ffmpeg | ✅ 2026-06-25 — targets de-duplicated, compose rewritten, ffmpeg installed |
| 4.1 | Medium | SVG/document previews via `<object>` executed embedded scripts | ✅ 2026-06-25 — `<img>` for images, plain `<iframe>` + server CSP `script-src 'none'` + `nosniff` for documents |
| 4.2 | Low | Verify text-preview escaping | ✅ 2026-06-25 — Prism tokenizes into the DOM (no raw HTML); `text/plain` + `nosniff` confirmed |
| 5.1 | Medium | `checkSupport` version-range comparison inverted | ✅ 2026-06-25 — inclusive interval check (a residual gap in the same branch is tracked as **9.9**) |
| 5.2 | Low | Backslash path fix replaced only the first `%5C` | ✅ 2026-06-25 — global regex |
| 5.3 | Low | `toFileUrl` percent-encoded path separators | ✅ 2026-06-25 — per-segment encoding |
| 5.4 | Low | `RequestCache.setPending` cast `undefined` to `T` | ✅ 2026-06-25 — `data?: T`, `get()` returns `null` for pending-only entries |
| 6.1 | Low | Event bus wrapped a singleton in a `computed` | ✅ 2026-06-25 — returns the singleton directly |
| 6.2 | Low | `scroll_offset` map grew unbounded | ✅ 2026-06-25 — capped at 50 entries, LRU eviction, encapsulated behind store methods |
| 6.3 | Low | Vue Devtools plugin always registered | ✅ 2026-06-25 — gated on `command === 'serve'` |
| 6.5 | Low | `media-chrome` eagerly loaded on every page visit | ✅ 2026-06-28 — import moved into the lazy Audio/Video viewers; first-paint JS −14% (≈301.8 → ≈258.9 KB gzip) |
| 7.2 | Correctness | `determine_created_at` returned modification time | ✅ 2026-06-29 — `metadata.created()` (btime) with `modified()` fallback for filesystems without btime |
| 7.3 | Defense-in-depth | Add `frame-ancestors 'none'` to CSP | ✅ 2026-06-28 — CSP now `script-src 'none'; frame-ancestors 'none'` |

**Still-standing strengths** (from §6.4): virtualized lists
(`@tanstack/vue-virtual`), client request dedupe + TTL cache, lazy-loaded
preview components/Prism/`media-chrome` with sensible `manualChunks`,
`AbortController` on navigation, `NamedFile` (range/ETag/Last-Modified) +
compression on the server.

---

## Open items — carried forward

### 1.1 (High) No authentication; access control is a source-IP CIDR check — 🟡 Partially addressed
`server/src/lib/gatekeeper.rs`

> **🟡 Partially addressed (2026-06-25):** the IP gate was hardened (real auth
> was intentionally left out of scope per request). `gatekeeper::verify` parses
> the peer's actual `IpAddr` (via `peer.ip().to_canonical()`, which also
> normalizes IPv4-mapped IPv6) and tests it against configurable CIDR ranges
> using the `ipnet` crate. The default allowlist covers all RFC1918 ranges plus
> loopback and IPv6 ULA; operators can override it via `allowed_cidrs` /
> `WEB_FILE_BROWSER_ALLOWED_CIDRS`. The immediate TCP peer is used and
> **`X-Forwarded-For` is not trusted**.
>
> **Still open (by request — no token/basic auth added):** this remains a
> convenience network filter, not authentication. Behind a reverse proxy every
> client appears as the proxy's IP, so the **reverse-proxy bypass** is not
> closed — that needs real auth or a trusted-proxy `X-Forwarded-For`
> configuration. (The production Caddy proxy setup leans into this
> deliberately: actix binds `127.0.0.1` so the proxy is the only entry point.)

**Recommendation:** Add real authentication (shared token / basic-auth /
reverse-proxy auth) if the server is ever exposed beyond a trusted network.

### 2.2 (Medium) Directory listing does O(N) header reads + ffprobe on every cold load — 🟡 Partially addressed
`server/src/structs/entry_details.rs` (`from_raw`, `determine_file_format`,
`determine_duration`)

> **🟡 Partially addressed (2026-06-25):** the cold-load cost is now paid
> concurrently (≤8 entries in flight) rather than sequentially, and listings are
> cached behind an `Arc` so repeat visits are a pointer clone. The remaining
> recommendations — deferring expensive metadata to a lazy/on-demand endpoint,
> persisting the media cache across restarts, and a longer/invalidation-based
> TTL — were **not** implemented and remain open.

**Recommendation:** Defer expensive metadata (duration, precise type) to a
lazy/on-demand endpoint or compute it only for the entries actually shown;
persist the media cache across restarts; consider a longer or
invalidation-based TTL.

### 7.1 (Informational) esbuild@0.27.7 — GHSA-g7r4-m6w7-qqqr — ✅ Accepted/tracked
`client/pnpm-lock.yaml`

esbuild's dev server (bundled with Vite) can be configured to respond to HTTP
requests from any host. Severity: **low**. Affects: **Windows only**, dev
server only, not the production build output, not the Rust server.

**Why not fixed now:** vite 8.1.0's peer-dep range (`^0.27.0 || ^0.28.0`)
causes `pnpm update esbuild` to resolve to `0.27.7` (the newest `0.27.x`), not
`0.28.x` (the patched range). Forcing it via `pnpm.overrides` is viable but
requires a full rebuild to verify no breakage — effort not proportional to a
dev-only, Windows-only, low-severity CVE on a macOS host.

**Triage conclusion:** accepted low-risk, reviewed 2026-06-28; check again on
next vite major bump.

---

## 9. Optimization / Refactor / Simplification Pass — 2026-07-20

A full pass over both packages focused on optimization, refactoring, and
simplification opportunities. No new security vulnerabilities found; the
significant items are two correctness bugs on rarely-exercised error paths
(9.1, 9.7), a set of duplicated-orchestration refactors, and dead code.

### Server

### 9.1 (Medium) `.webloc` parsing can panic per-request; leftover debug output; dead `.url` support — ✅ Resolved
`server/src/lib/parse_url_file.rs`,
`server/src/structs/entry_details.rs` (`external_url`)

> **✅ Resolved (2026-07-20):** the parse chain now returns `Option<String>`
> end-to-end. `external_url` reads the file with `.ok()?` at both levels (no
> more `unwrap()` — an unreadable or non-UTF-8 shortcut, e.g. a binary-plist
> `.webloc`, yields `None`), `parse_webloc_file` returns `None` on malformed
> XML instead of panicking and the per-tag `println!` is gone, and the `.url`
> INI format (`URL=` line) is now actually parsed. Empty/whitespace results
> normalize to `None` so the client sees `null` rather than `""`. Verified
> live against a smoke root: XML `.webloc` → its URL, `.url` → its URL,
> binary/empty/URL-less `.webloc` → `null` with the listing returning 200,
> and the entries rendering correctly (external links vs. plain files) in the
> browser.

Three problems in the external-URL path, which runs for every `.url`/`.webloc`
file in every uncached listing:

- `external_url` does `Some(content.unwrap())` on the inner
  `fs::read_to_string` result — a `.webloc` that is unreadable **or not valid
  UTF-8 panics**. Real macOS `.webloc` files are frequently *binary* plists,
  so this is a panic on ordinary input, not a corner case.
- `parse_webloc_file` contains a `panic!` on malformed XML and a leftover
  `println!` that fires for **every XML start tag** parsed.
- `parse_url_file` (the `.url` half) is unimplemented and returns `""`, yet
  `"url"` is listed in `EXT_URL_EXTS` — so every `.url` file is read fully
  from disk to produce `Some("")`.

**Recommendation:** Make the parse chain return `Option<String>` end-to-end;
replace the `unwrap()`/`panic!`/`println!` with graceful `None`s; either
implement the (trivial, INI-style) `.url` parse or drop `"url"` from
`EXT_URL_EXTS` until it is implemented.

### 9.2 (Low) `read_file::read` triplicates the open logic and hides a `read_mode_threshold` inconsistency — 🔲 Open
`server/src/services/read_file.rs`

All three `DispositionKind` arms perform the same
`NamedFile::open_async().use_etag(true).use_last_modified(true).set_content_disposition(...)`
sequence; only the `DispositionType` differs. The duplication also hides an
inconsistency: `Attachment`/`Inline` set `.read_mode_threshold(0)` while
`Auto` does not, though all three serve the same files.

**Recommendation:** Resolve the `DispositionType` first (the `Auto` sniff
included), then use a single open-and-configure path — and decide the
`read_mode_threshold` question once, intentionally.

### 9.3 (Low) Dead server code — 🔲 Open
`server/src/app_config.rs`, `server/src/structs/entry_details.rs`,
`server/src/lib/error.rs`

- `AppConfig.nonalpha_pattern` is compiled at startup and never read.
- `impl Index<&str> for EntryDetails` (a panicking string-indexed field
  accessor) has no callers.
- `AppError::IoError` and its `From<io::Error>` impl are never constructed —
  every call site uses `map_err` into `Internal`.

**Recommendation:** Delete all three.

### 9.4 (Low) Duplicated entry-resolution pipeline in `read_dir` and `search` — 🔲 Open
`server/src/services/read_dir.rs`, `server/src/services/search.rs`

Both services contain the identical "phase 2" block —
`stream::iter(raw_entries).map(from_raw).buffered(ENTRY_CONCURRENCY).collect()`
— plus a duplicated `ENTRY_CONCURRENCY` constant with the same rationale
comment.

**Recommendation:** Extract a shared `EntryDetails::resolve_all(raw, data)`
helper (or a free function in `entry_details.rs`) so the concurrency policy
lives in one place.

### 9.5 (Low) Minor `entry_details` / `app_config` cleanups — 🔲 Open
`server/src/structs/entry_details.rs`, `server/src/app_config.rs`

- `from_raw` checks `entry_type == DIR` and `determine_file_format`
  immediately re-checks the same condition.
- `file_type()` / `full_type()` allocate a fresh `String` for what are all
  static literals; returning `&'static str` (or `Cow`) removes ~20 allocations
  per directory entry in the hottest struct in the app.
- `parse_app_log_level` builds a `HashMap` to replicate what
  `log::LevelFilter::from_str` (case-insensitive) already does in one line.

**Recommendation:** Deduplicate the DIR check, switch the type mappers to
static strs, and use `LevelFilter::from_str` with an `Info` fallback.

### 9.6 (Optional) Listing payload carries client-derivable fields — 🔲 Open
`server/src/structs/entry_details.rs`, `client/src/lib/sort.ts`,
`client/src/types/entry.d.ts`

Each JSON entry ships `name_lowercase`, `duration_order`, and formatted +
epoch duplicates of both timestamps, purely so the client's `sort.ts` can
`prop()` them directly. All are derivable client-side in a single pass over
the listing. Meaningful response weight for large directories, but it is a
coordinated server + client change.

**Recommendation:** Only worth doing if very large listings are common; if so,
drop the derived fields from `EntryDetails` and compute them in
`processEntries` on the client.

### Client

### 9.7 (Medium) A failed directory request poisons the request cache for up to 5 minutes — ✅ Resolved
`client/src/views/DirectoryView.vue` (`getEntries`),
`client/src/lib/request_cache.ts`

> **✅ Resolved (2026-07-20):** `RequestCache` gained a single
> `fetch(key, factory)` method that resolves fresh-cached / in-flight / new
> request in one place and **removes its pending entry when the promise
> rejects** (guarded so a newer request's entry is never clobbered; the
> attached `.catch` also absorbs the would-be unhandled rejection).
> `getPending`/`setPending` were removed as superseded. `getEntries` collapsed
> onto the new API, and two companion bugs in it were fixed: the `error` flag
> is now reset at the start of each fetch (it previously latched `true`
> forever, keeping the error view over later successful loads), and the 150 ms
> loading timer is cleared in `finally` (it previously leaked on the error
> path). Verified live: with the API stopped, navigating shows the error view;
> after restarting the API, a search from the same SPA session succeeds
> (error state clears) and clearing the search refetches the exact
> previously-failed path successfully — no reload, no 5-minute lockout, no
> console unhandled-rejection warnings.

`getEntries` stores `request_promise.then(...)` via `setPending`, but nothing
removes the entry when the promise **rejects**, and `getPending` never checks
the TTL. After one transient network failure, every revisit of that path
re-awaits the same rejected promise and instantly shows the error state until
the 5-minute TTL evicts the entry. The stored rejected chain also surfaces as
an unhandled-rejection console warning.

**Recommendation:** Remove the pending entry when its promise rejects. The
clean shape is a single `RequestCache.fetch(key, factory)` method that
encapsulates cached/pending/fresh + failure cleanup — which also collapses
`getEntries`' three-branch cache dance into one call (see 9.14 for the
companion dead-method trim).

### 9.8 (Low) `useIsMobile`'s CSS-variable breakpoint read never works — 🔲 Open
`client/src/composables/is_mobile.ts`

`--breakpoint-md` resolves to `48rem`, and `Number('48rem')` is `NaN`, so the
observed `useCssVar` is dead weight and the composable always uses the 768
fallback.

**Recommendation:** Either parse the value properly (`parseFloat` × root
font-size) or delete the CSS-var plumbing and keep the honest constant.

### 9.9 (Low) `checkSupport`'s version-range branch ignores the range's support flag — 🔲 Open
`client/src/lib/browser.ts`

Residual gap from **5.1**: the exact-match branch checks
`version_map[matched_version] === 'y'`, but the range branch returns `true`
whenever the version falls inside *any* range — including ranges flagged `'n'`
or `'a'` (partial support).

**Recommendation:** `return version_map[range] === 'y';` inside the range
match, mirroring the exact-match branch.

### 9.10 (Low) `ViewStack` / `ViewGrid` duplicate the virtualizer wiring — 🔲 Open
`client/src/components/directory_view/view_layouts/ViewStack.vue`,
`ViewGrid.vue`

~60 lines are duplicated between the two: the one-shot `scroll_margin` watch
(with its subtle anti-jitter rationale), the virtualizer options object, and
the `scrollToIndex` watch.

**Recommendation:** Extract a `useVirtualizedEntries()` composable so the
hard-won scroll-margin behavior is enforced in exactly one place.

### 9.11 (Low) Item layouts duplicate the "last modified" tooltip badge — 🔲 Open
`client/src/components/directory_view/item_layouts/ListItem.vue`,
`RowItem.vue` (and partly `GridItem.vue`)

The tooltip'd relative/absolute "last modified" badge — including identical
tooltip timing config — is repeated per layout.

**Recommendation:** Extract an `EntryModifiedBadge.vue` (and optionally a
duration badge) so the markup and tooltip behavior stay consistent.

### 9.12 (Low) `PreviewDialog` rebuilds its type mapping per evaluation; reduced-motion is sampled once — 🔲 Open
`client/src/components/directory_view/preview_dialog/PreviewDialog.vue`

- The `preview_type` computed rebuilds the entire six-entry
  `PreviewType → { class, component }` mapping object on every re-evaluation;
  only the SVG class suffix is actually dynamic.
- `reduced_motion` samples `matchMedia('(prefers-reduced-motion: reduce)')`
  once at setup and never updates.

**Recommendation:** Hoist the mapping to module scope (compute the SVG suffix
separately); use VueUse's `useMediaQuery` for a reactive reduced-motion flag.

### 9.13 (Low) `router.ts` — twin query functions and a hand-maintained search-param list — 🔲 Open
`client/src/stores/router.ts`, `client/src/lib/utils.ts`

- `pushQuery` / `replaceQuery` are identical except for `$router.push` vs
  `.replace`.
- `clearSearch` hand-lists the five search params that
  `TRANSIENT_QUERY_PARAMS` (minus `linked`) already enumerates — a new search
  param must currently be added in two places.

**Recommendation:** One private `applyQuery(patches, { replace })`; derive
`clearSearch`'s patch object from the transient-param list.

### 9.14 (Low) Dead client code — 🔲 Open
`client/src/lib/utils.ts`, `client/src/lib/entry_helpers.ts`,
`client/src/lib/request_cache.ts`, `client/src/lib/sort.ts`

- `utils.ts`: `capitalize` and `sleep` have zero callers.
- `entry_helpers.ts`: the commented-out sort functions
  (`sortByDir`/`sortByKey`/`sortDirectoriesTop`) and their commented imports.
- `request_cache.ts`: `invalidate`, `clear`, `size`, `getStats`, `cleanup`
  are all unused (~45 lines). Pairs naturally with the 9.7 `fetch()` refactor.
- `sort.ts`: `criteria`'s first element is immediately discarded by the
  `criteria.slice(1)` below it, and `sort_dir` is re-validated despite the
  router store's `validate` already guaranteeing it.

**Recommendation:** Delete; rebuild `sort.ts`'s criteria list without the
dummy element.

### 9.15 (Low) `TextPreview` Prism-hook cleanup is fragile; global DOM queries — 🔲 Open
`client/src/components/directory_view/preview_dialog/file_viewers/TextPreview.vue`

- The `complete` hook is removed by comparing `hook.name ===
  postHightlightHandler.name` — function-name string comparison is vulnerable
  to minifier name collisions; comparing function identity is simpler and
  exact. (The handler name also has a typo: `Hightlight`.)
- `refreshTextView` / `postHightlightHandler` query `document` globally
  (`document.querySelector('pre code')`) instead of scoping to `text_ele`.

**Recommendation:** Remove the hook by identity, fix the typo, scope the DOM
queries to the component's own subtree.

---

## 10. Suggested Priority Order (open items)

| # | Area | Severity | Effort | Item |
|---|------|----------|--------|------|
| 1 | Server robustness | Med | Low | ✅ 9.1 — `.webloc` panic paths, debug `println!`, dead `.url` support |
| 2 | Client correctness | Med | Low | ✅ 9.7 — failed request poisons the pending cache (add `fetch()` API) |
| 3 | Client correctness | Low | Low | 9.8, 9.9 — `useIsMobile` NaN breakpoint; `checkSupport` range flag |
| 4 | Dead code | Low | Low | 9.3, 9.14 — server + client dead-code deletions (zero risk) |
| 5 | Server simplification | Low | Low | 9.2, 9.4, 9.5 — `read_file` collapse, shared resolve pipeline, minor cleanups |
| 6 | Client refactors | Low | Med | 9.10–9.13, 9.15 — virtualizer composable, shared badges, dialog/router cleanups |
| 7 | Server sec | High | High | 1.1 — real authentication (still deferred by request) |
| 8 | Server perf | Med | Med | 2.2 — lazy/persistent media metadata |
| 9 | Payload | Low | Med | 9.6 — drop client-derivable listing fields (optional) |
