# Video.js migration – cross-browser verification handoff

> **For the session reading this:** you're picking up a migration that is already implemented and pushed. Your job is to **test the areas the first session couldn't reach**, fix anything that's broken, and report back. Don't redesign the player. Read `CLAUDE.md` first (especially the "Audio/video previews are Video.js 10 players…" bullet), then this file top to bottom.

## Where things stand

- **Branch:** `ccr-e6c7c619-ftyrhu`. **Migration commit:** `e1f55da` ("Migrate preview media players from Media Chrome to Video.js 10"). Its parent `e1f55da~1` (`95d37ef`) is the last Media Chrome version. Use it for side-by-side comparisons (see [Comparing against Media Chrome](#comparing-against-media-chrome)).
- **What changed:** the audio and video file previews (`client/src/components/directory_view/preview_dialog/file_viewers/{Video,Audio}Preview.vue`) now use **Video.js 10** (`@videojs/html@10.1.0`, packaged install, `video`/`audio` presets, **no skin**). The controls are composed from bare `@videojs/html` UI elements and styled to recreate the old Media Chrome look and layout.
- **Status:** lint, `vue-tsc` and `vite build` are clean. Browser behavior was verified **only in headless Playwright Chromium 141 on Linux** (desktop 1280×800 plus Pixel 7 emulation).

### Files to know

| File | Role |
| --- | --- |
| `client/src/components/directory_view/preview_dialog/file_viewers/VideoPreview.vue` | Video player: desktop bar, mobile centered transport row plus two-row bar, poster, buffering spinner, hotkeys, mouse-click gesture |
| `client/src/components/directory_view/preview_dialog/file_viewers/AudioPreview.vue` | Audio player: desktop bar with volume slider, mobile transport row, controls always visible |
| `client/src/components/directory_view/preview_dialog/file_viewers/media_player/` | Shared pieces: `register.ts` (registers every Video.js element and holds the ±5 s `SEEK_HOTKEYS`), `MediaLoopButton.vue`, `MediaMuteButton.vue`, `MediaTimeDisplay.vue`, `MediaTimeSlider.vue`, `MediaVolumeSlider.vue` |
| `client/src/composables/media_player.ts` | App-side workarounds for Video.js gaps: `useMediaPreferences`, `useMediaLooping`, `usePausedTouchToggle` |
| `client/src/components/directory_view/preview_dialog/PreviewDialogContent.vue` | The shared player theme (`.preview-media-player` block): colors, icon swaps, sliders, tooltips, autohide CSS |
| `client/src/components/directory_view/preview_dialog/PreviewDialog.vue` | Arrow-key gallery navigation yields to a focused `media-container` |
| `client/src/composables/preview_swipe.ts` | `media-controls-group` is a swipe exemption |
| `client/vite.config.ts` | `VIDEOJS_ELEMENTS` (exact tag list for Vue's `isCustomElement`); `manualChunks` pins `@oxc-project+runtime` helpers to `vendor-core` so lazy `vendor-media` stays off first paint |
| `docs/videojs-migration/verify-players.cjs` | Automated Playwright checks (run per engine – see below) |
| `docs/videojs-migration/make-test-media.sh` | Generates the test media library |

### Decisions already made (don't relitigate)

- **Version 10.1.0, no `minimumReleaseAgeExclude`.** The user chose this. pnpm 12's one-day release-age policy rejects `@videojs/*@10.1.0` until **2026-10-14 ~16:29 UTC** (the last package, `@videojs/html`, was published 2026-10-13 16:28:34 UTC). **Do not add the exemption pnpm suggests.** Before that time, *every* pnpm command fails (not just `install`, `pnpm exec`/`pnpm dev` too). Either wait, or run tools directly: `node node_modules/vite/bin/vite.js`, `node node_modules/vue-tsc/bin/vue-tsc.js -b`, and so on.
- **Custom UI, no packaged skin.** It preserves the app's existing control layout. Shadcn skin source isn't available for Vue.
- **Controls idle-hide after 2 s even while paused** (the app's pre-migration behavior, from commit `95d37ef` "Hide video player controls when paused"). Video.js keeps controls visible while paused by design, so the CSS keys off `data-user-active` instead of `data-visible`.

## Known gaps and intentional deviations

These come from the migration guide's Known gaps section plus behavior the first session observed.

| Area | Media Chrome (before) | Now | Notes |
| --- | --- | --- | --- |
| Autohide delay | `autohide='2'` | Fixed 2 s in Video.js | Same value, so no change. `autohideovercontrols` has no equivalent, but a still pointer over the controls hides them either way |
| Hide while paused | App CSS override | `data-user-active` CSS plus `usePausedTouchToggle` | Without the composable, a touch tap on a paused video could never re-show hidden controls |
| Loop toggle | Custom `MediaChromeButton` subclass | `MediaLoopButton.vue` (plain `role=switch` button) over the native `loop` property via `useMediaLooping` | Video.js has no loop state |
| Volume/mute memory | Media Chrome's implicit `localStorage` | `useMediaPreferences` with the **same keys** (`media-chrome-pref-volume`, `media-chrome-pref-muted`) | Video restores volume only, always opens muted and never writes. Audio restores and saves both |
| Hotkeys | Media Chrome defaults, ±5 s seek | Space/k, m, f (video only), ArrowLeft/Right and j/l at ±5 s, ArrowUp/Down volume, `<`/`>` speed | **Dropped:** `c` (captions – there are no tracks), `p` (PiP – no button), `?` (shortcuts dialog). Hotkeys only fire while the player container has focus (Video.js default) |
| Tooltips | Media Chrome tooltips | Native-popover `media-tooltip`, desktop bar only | Shortcut hints are hidden to match the old look. Popovers live inside the `<dialog>` subtree, so they aren't inert |
| `playsinline` | **Not set** | **Set** on the `<video>` (from the Video.js install plan) | **Behavior change on iPhone:** video now plays inline with the custom controls instead of jumping to the native iOS fullscreen player. **Decided: keep inline.** Fullscreen should be the user's deliberate choice (the fullscreen button) |
| Font | Media Chrome default (Arial) | Inherits the app font | Intentional |
| Esc while fullscreen | Exits fullscreen **and closes the preview dialog** (Chromium; WebKit left it open) | **Fixed:** Esc only exits fullscreen; Esc outside fullscreen closes the preview | `PreviewDialog.vue`: the Esc handler skips presses while fullscreen (and for 300 ms after leaving it), and `closedby='none'` stops the dialog's native Esc close, whose `cancel` Chromium won't let pages cancel without a fresh user activation. Needs a real-browser check: the in-app browser denies fullscreen |
| Captions, analytics | None | None | Nothing to migrate. Out of scope unless the user asks |
| Browser floor | – | Chrome/Edge 111, Firefox 121, Safari/iOS 16.4 | Tailwind v4 already needed the same or newer (Firefox 128), so support doesn't shrink. Popover API arrives in Firefox 125 and Safari 17; older supported versions use Video.js's in-player fallback |

## What was verified already (headless Chromium only)

53/55 automated checks passed. The two failures were H.264 MP4s, which the open-source Playwright Chromium can't decode (`canPlayType('video/mp4; codecs="avc1…"') === ''`). Verified:

- original media URLs, poster, `preload='metadata'`, video starts muted
- play/pause and icon swap, time display, mute, loop, time-slider seek
- mouse click on the picture toggles playback
- hotkeys: arrows ±5, k, m, f, and arrows staying with a focused player
- autohide while playing and while paused, mouse-move reveal
- tooltips, fullscreen on `media-container`
- gallery arrow-key navigation and touch swipe over the video
- audio: playback, volume slider, prefs saved and restored (including legacy Media Chrome values), never autohides
- mobile: centered transport, ±5 s seek buttons, tap toggles controls while playing and paused, mobile audio layout and loop
- first-paint JS unchanged (~272 KB gzip, `vendor-media` lazy)

## What you need to verify

Work through every section below and record the results in a findings table, as described in [Reporting back](#reporting-back). Automated means `verify-players.cjs`; manual means you drive it or ask the user to.

### A. Codecs the first session couldn't decode (automated)

1. **H.264/AAC MP4 playback** in branded Chrome (`ENGINE=chromium CHANNEL=chrome`), Edge if installed (`CHANNEL=msedge`), Firefox, and WebKit: `clip.mp4`, `portrait.mp4`, `long.mp4`.
2. **Poster hides on play** with an H.264 source.
3. **`long.mp4` (>1 h):** time display reads `0:00:00 / 1:01:40`.
4. **AAC audio:** `song.m4a`.

### B. Firefox desktop (automated, plus manual follow-up)

Run the full suite with `ENGINE=firefox`, then manually check:

1. **Late-`moov` MP4 seeking (`clip-late-moov.mp4`)** – the reason `preload='metadata'` exists (see the comment on the `<video>` in `VideoPreview.vue`). The whole 120 s file must be seekable right after metadata loads, and jumping to 1:40 must land quickly. Compare with `95d37ef` if it misbehaves.
2. Tooltip placement and fade, slider dragging (thumb follows the pointer, hover preview time label), focus rings.
3. Fullscreen enter/exit (button, `f`, Esc) and the layout while fullscreen.
4. Volume and mute memory across reloads (audio), and that video never writes prefs.
5. If available, **Firefox 121–124** (no Popover API): tooltips should still render inside the player without layout breakage.

### C. Safari / WebKit desktop (automated with `ENGINE=webkit`, then real Safari on macOS)

1. Full suite under WebKit.
2. Real **Safari 16.4+** on macOS:
   - playback and fullscreen (Safari's fullscreen API differs from Chromium/Firefox, so watch the container layout and exit paths)
   - tooltips: Popover API needs Safari 17, so 16.4–16.x uses the fallback
   - slider drag, hotkeys (Safari's Tab-focus setting affects keyboard-only navigation)
3. VP9 WebM (`clip2.webm`) support varies on WebKit, so note what happens. The mobile suite falls back to `clip.mp4` automatically.

### D. Real mobile devices (manual – emulation can't cover these)

Use the dev server over the LAN (`pnpm start` runs Vite with `--host`), or the HTTPS release setup (section E). The device must be allowed by the server's IP gate; private ranges are allowed by default.

**iPhone (iOS Safari 16.4+):**

1. **`playsinline` deviation:** tapping play keeps the video inline with the custom controls. Report it either way, and ask the user whether they prefer the old native-fullscreen behavior.
2. **Fullscreen:** iPhone Safari doesn't support element fullscreen. Check what the fullscreen button does (hidden? falls back to native video fullscreen? nothing?). Media Chrome on `95d37ef` is the reference.
3. Tap toggles controls while playing **and while paused**; the centered ±5 s and play buttons work; controls idle-hide after 2 s.
4. Horizontal swipe over the video pages the gallery. A vertical swipe down from the top dismisses the dialog.
5. **Audio:** iOS reports volume as unsupported, so the volume slider hides itself (it's desktop-only anyway). Mute should still persist across reopen.
6. The mobile transport row and two-row video bar look right in portrait and landscape (`portrait.mp4` too).

**Android (Chrome, and Firefox/IronFox – the project calls these out in `CLAUDE.md`):**

1. Same checks as iPhone items 3–6, plus fullscreen button behavior (element fullscreen should work here).
2. Tap reliability: no flicker (one tap must not show then immediately hide the controls), and taps on the seek/play buttons never toggle the controls.

### E. Production build and HTTPS release (manual)

The first session only tested the Vite dev server.

1. `pnpm run release` (needs `bin/caddy-l4-*` – see `CLAUDE.md`), or at least `pnpm build` plus a static preview pointed at the API.
2. Confirm the players work from the built bundle: `vendor-media` loads only when a media preview opens (DevTools Network), there are no CSP or console errors, and tooltips and popovers behave the same.
3. Over HTTPS through Caddy on a device that trusts the CA: playback, seeking (HTTP range requests through the proxy), poster loading.

### F. Accessibility and keyboard (manual, plus a screen reader)

1. Tab order through the bar: play, time slider, mute, loop, time, fullscreen. Every control shows a visible focus style, and controls stay visible while keyboard focus is inside them (automated in the suite).
2. **Screen reader** (VoiceOver on macOS/iOS, NVDA on Windows if available):
   - buttons announce state-aware names ("Play"/"Pause", "Mute"/"Unmute", "Enter fullscreen"…)
   - the loop button announces as a switch, "Loop, on/off"
   - the time slider reads as "Seek" with a value
   - tooltips are not announced twice
3. Hotkeys don't fire while typing in other inputs (for example, the search dialog over a preview).

### G. Behavior-parity spot checks against Media Chrome (manual, side by side)

Using the [comparison setup](#comparing-against-media-chrome), compare:

1. Visual parity of the desktop and mobile bars (sizes, colors, spacing, hover color `#232331`). Small differences are fine; flag anything that looks broken.
2. Buffering spinner on a throttled network (DevTools "Slow 3G"). It should appear after ~500 ms of stalling while playing, never while paused, and hide the mobile centered buttons while visible.
3. Switching between media in the gallery (arrows/swipe): each new entry starts muted (video), loop resets per element, and the previous file stops playing.
4. Legacy prefs: in a browser profile that used the old Media Chrome build, the saved audio volume and mute carry over.
5. Background tab: audio keeps playing; nothing throws when returning.

## Setup

```sh
git fetch origin ccr-e6c7c619-ftyrhu && git checkout ccr-e6c7c619-ftyrhu
cd client
cp src/config.template.toml src/config.toml        # if missing (gitignored)
pnpm install --frozen-lockfile                     # fails before 2026-10-14 ~16:29 UTC – see "Decisions"
cd ..

# Test library (needs ffmpeg with libx264, libvpx-vp9, libopus, libmp3lame):
docs/videojs-migration/make-test-media.sh /tmp/vjs-media

# Server on the dev port the client expects ([dev].server_port = 8100):
(cd server && WEB_FILE_BROWSER_ROOT_DIR=/tmp/vjs-media WEB_FILE_BROWSER_PORT=8100 cargo run)
# Client (or: node node_modules/vite/bin/vite.js --port 5173 --strictPort):
(cd client && pnpm exec vite --port 5173 --strictPort)
```

Open a file directly with `http://127.0.0.1:5173/?linked=<file name>`, which auto-opens its preview. For a phone on the LAN, use the machine's LAN IP instead of `127.0.0.1` (the client derives the API host from the page's hostname).

### Running the automated suite

`playwright` is deliberately **not** a project dependency, so install it in a scratch directory:

```sh
mkdir -p /tmp/vjs-verify && cd /tmp/vjs-verify
npm init -y >/dev/null && npm i playwright@1.56.1
npx playwright install chromium firefox webkit

V=<repo>/docs/videojs-migration/verify-players.cjs
ENGINE=chromium CHANNEL=chrome node $V   # branded Chrome = H.264 support
ENGINE=firefox node $V
ENGINE=webkit  node $V
# Options: HEADED=1 to watch, ONLY=desktopVideo,lateMoov,desktopAudio,mobile, BASE/API to override origins.
```

Each run prints `PASS`/`FAIL`/`NOTE` lines plus a total, and saves screenshots to `./shots-<engine>`. **Expected result:** everything passes on every engine with H.264. A `FAIL` that names a codec on an engine without that codec is environmental. Say so instead of "fixing" it. Timing-based checks (autohide at 2 s, the 1 s fade) can flake on a loaded machine: rerun once before investigating.

### Comparing against Media Chrome

```sh
git worktree add /tmp/fsv2-mediachrome e1f55da~1
cd /tmp/fsv2-mediachrome/client && cp <repo>/client/src/config.toml src/
pnpm install --frozen-lockfile        # no @videojs packages here, so the release-age policy doesn't bite
node node_modules/vite/bin/vite.js --port 5174 --strictPort
# The same server on :8100 serves both; compare http://127.0.0.1:5174/?linked=… with :5173.
git worktree remove --force /tmp/fsv2-mediachrome   # when done
```

Media Chrome's markup uses `media-controller` / `media-control-bar` where the new code uses `media-container` / `.preview-media-player__bar`.

## Fixing things

- **Follow `CLAUDE.md`'s Video.js gotchas:**
  - Add new tags to `VIDEOJS_ELEMENTS`.
  - Bind numeric props (`:seconds='5'`).
  - Full-surface overlays must stay `pointer-events: none`.
  - Register JS-created elements in `register.ts`.
- **Docs:** use `client/node_modules/@videojs/html/docs/llms.txt` (version-matched). The Video.js skill is installable with `npx @videojs/cli agents skills`. Relevant pages: `guides/migrate-from-media-chrome.md`, `guides/controls.md`, `guides/fullscreen.md`, `guides/browser-support.md`, `reference/components/*`.
- Before committing: `pnpm run lint`, `pnpm run check`, `pnpm run build-only` (or their `node node_modules/...` equivalents before the release-age cutoff), then rerun `verify-players.cjs` on the engines you touched.
- **Don't:** add a `minimumReleaseAgeExclude`, change the Video.js version, re-enable a packaged skin, or change intentional deviations (table above) without asking the user. Commit messages and docs must not include model identifiers.

## Reporting back

End with a findings table:

| # | Area (section) | Browser / device + version | Result (pass / fail / deviation) | Evidence (check name, screenshot, steps) | Action taken or proposed |
| --- | --- | --- | --- | --- | --- |

Then list:

- what you fixed (with commits)
- open questions for the user, at minimum the iPhone `playsinline` behavior and Esc closing the dialog while fullscreen
- anything you couldn't test and why

## Round 2 results (macOS, Claude desktop browser pane – Chromium 152 with H.264)

Driven by hand in the in-app browser against a scratch server + this branch, with `e1f55da~1` alongside for comparison. Playwright was dropped: its Firefox builds don't launch on this macOS, and the user prefers manual verification in the local browser.

| # | Area | Result | Notes |
| --- | --- | --- | --- |
| 1 | A: H.264/AAC (`clip.mp4`, `portrait.mp4`, `song.m4a`), VP9 (`clip2.webm`) | pass | poster fades to 0 on play |
| 2 | A: `long.mp4` time display | pass | `0:00:00 / 1:01:40` |
| 3 | B1: late-`moov` seek (Chromium) | pass | seekable 0–120 at metadata, seek to 1:40 in ~30 ms. Firefox still unverified |
| 4 | Desktop: play/pause labels, click-to-play, hotkeys (arrows ±5 stay in player, j, k, m) | pass | |
| 5 | Desktop: autohide playing + paused, hover reveal, tooltips (shortcut hint hidden) | pass | |
| 6 | Fullscreen (button, `f`) | not testable | the pane blocks element fullscreen; Media Chrome fails identically there |
| 7 | Audio prefs: legacy restore, slider drag saves, mute persists; video restores volume only, always muted, never writes | pass | |
| 8 | G3: gallery switch | parity, not as this doc expected | the `<video>` element is reused, so unmute and loop carry over to the next entry. Media Chrome on `95d37ef` does exactly the same. Previous media does stop |
| 9 | Mobile emulation: centred row, ±5 seek, tap toggles while paused + playing, idle hide, portrait, audio layout | pass | touch driven with synthetic `pointerType: 'touch'` events |
| 10 | F1: tab order play → seek → mute → loop (`aria-checked`) → fullscreen, focus fill, controls stay visible while focused | pass | the time display isn't focusable (same as before) |
| 11 | Visual parity: video letterbox background | **fixed** | Media Chrome's controller painted black. The new container was transparent, so the listing showed through above/below the picture (very visible on mobile). Fixed with `bg-black` on the video container |
| 12 | E: built bundle | pass (static) | `vendor-media` isn't in `index.html`'s preloads |

Decisions since: keep `playsinline` (inline playback); Esc while fullscreen must only exit fullscreen (fixed, see the deviations table).

Still open: Firefox (B), real Safari (C), real iPhone/Android (D), HTTPS via Caddy (E3), screen reader (F2), throttled buffering spinner (G2).
