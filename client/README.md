# web_file_browser_client

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
pnpm install
```

### Compile and Hot-Reload for Development

```sh
pnpm dev
```

### Type-Check, Compile and Minify for Production

```sh
pnpm build
```

### Lint with [ESLint](https://eslint.org/)

```sh
pnpm lint
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
pnpm test
```

## Expanded mode (no Fullscreen API)

Video and image previews fill the window through an in-page **expanded mode** instead of the browser's Fullscreen API.

Why: on Android 17 (seen on Nothing OS 5.0), Chromium-based browsers pass every fullscreen request on to the OS, which pulls a split-screen task to the whole display. Page code can't intercept that, so the app never makes the request. Expanded mode only ever fills the browser's own window, so the split stays put.

- **Videos:** the Expand button in the player's control bar, or `f` while the player has focus.
- **Images:** the Expand action in the preview's action bar (the ⋯ menu on mobile).
- **Leaving:** the same button, `Esc`, or the back gesture / button. Closing the preview or changing folder leaves it too.
- **Real fullscreen** is still there as an opt-in: the video player's Settings menu → *Native fullscreen* (off by default, remembered per browser, only shown where the browser supports it). Turning it on brings back the fullscreen button and makes `f` use it.

The behaviour lives in `src/composables/fake_fullscreen.ts`; the look is the `.preview-dialog--expanded` state of `PreviewDialog.vue`. There is no orientation lock (that needs real fullscreen), so rotate the device yourself.

## Installable app (PWA)

The client is a Progressive Web App: installed, it opens in its own window with no browser UI, so expanded mode covers everything visible.

- **Install:** use *Install app* in the navbar (the settings sheet on mobile) in Chrome / Chromium browsers. On iOS, use Share → *Add to Home Screen* (the same button shows the steps).
- **Updates:** when a new build is deployed, an *Update available* toast appears. Nothing reloads until you press *Reload*.
- **Offline:** the app shell is cached and opens without a network; folder listings are always fetched live, so they show an offline state and reload themselves on reconnect. Files, thumbnails and media are never cached, and the service worker never handles them (the API is a separate origin), so seeking in large videos works as in a normal tab.
- **HTTPS is required.** Service workers and installation need a secure context with a *trusted* certificate — clicking through a certificate warning is not enough, the worker silently fails to register. With the bundled Caddy setup, install Caddy's root CA (`.caddy/pki/authorities/local/root.crt`) on each device, as a *CA certificate* on Android. `localhost` works without any of this.
- **Testing locally:** the dev server doesn't register the service worker. Run `pnpm build && pnpm preview` and open the `localhost` URL.
- **Kill switch:** if a bad service worker ever ships, deploy a build made with `PWA_SELF_DESTROY=true pnpm build`. Its worker unregisters itself and clears its caches on every device that picks it up; then deploy a normal build again.

Configuration is in `vite.config.ts` (`VitePWA`); the app side (update toast, install prompt) is `src/composables/pwa.ts`.
