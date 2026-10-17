import { fileURLToPath } from 'node:url';

import Tailwind from '@tailwindcss/vite';
import Vue from '@vitejs/plugin-vue';
import UnpluginIconsResolver from 'unplugin-icons/resolver';
import UnpluginIcons from 'unplugin-icons/vite';
import UnpluginComponents from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import { ViteToml } from 'vite-plugin-toml';
import VueDevtools from 'vite-plugin-vue-devtools';

// Video.js custom elements used in Vue templates (the preview media players).
// Vue's compiler must leave these to the browser instead of resolving them as
// components; per the Video.js Vue guide this lists exact tags, not a prefix.
const VIDEOJS_ELEMENTS = new Set([
  'audio-player',
  'media-airplay-button',
  'media-audio-track-radio-group',
  'media-buffering-indicator',
  'media-cast-button',
  'media-container',
  'media-controls',
  'media-controls-backdrop',
  'media-controls-content',
  'media-controls-group',
  'media-dialog-backdrop',
  'media-dialog-close',
  'media-dialog-description',
  'media-dialog-popup',
  'media-dialog-title',
  'media-error-dialog',
  'media-fullscreen-button',
  'media-gesture',
  'media-hotkey',
  'media-icon',
  'media-menu',
  'media-menu-checkbox-item',
  'media-menu-content',
  'media-menu-item',
  'media-menu-separator',
  'media-mute-button',
  'media-pip-button',
  'media-play-button',
  'media-playback-rate-button',
  'media-playback-rate-radio-group',
  'media-poster',
  'media-quality-radio-group',
  'media-seek-button',
  'media-seek-indicator',
  'media-seek-indicator-value',
  'media-slider-buffer',
  'media-slider-fill',
  'media-slider-preview',
  'media-slider-thumb',
  'media-slider-thumbnail',
  'media-slider-track',
  'media-slider-value',
  'media-status-announcer',
  'media-status-indicator',
  'media-status-indicator-value',
  'media-text',
  'media-time',
  'media-time-group',
  'media-time-separator',
  'media-time-slider',
  'media-time-slider-chapter-title',
  'media-time-slider-chapters',
  'media-title',
  'media-tooltip',
  'media-tooltip-group',
  'media-tooltip-label',
  'media-tooltip-shortcut',
  'media-volume-indicator',
  'media-volume-indicator-fill',
  'media-volume-indicator-value',
  'media-volume-popover',
  'media-volume-slider',
  'video-player',
]);

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  appType: 'spa',
  build: {
    assetsDir: '.',
    copyPublicDir: true,
    emptyOutDir: true,
    minify: 'esbuild',
    outDir: 'dist',
    rollupOptions: {
      output: {
        // Manually define the chunks that dependencies will be bundled
        //   into to keep them as small as possible. Rolldown (Vite 8) no
        //   longer accepts the object form of `manualChunks`, so map each
        //   package to its chunk via the function form instead.
        manualChunks(id): string | undefined {
          // Helpers the es2020 lowering injects (class fields etc.) are shared by
          //   app and vendor code. Left alone, Rolldown parks them in the first
          //   chunk needing them — the lazy vendor-media (Video.js) — making it a
          //   first-paint import. Pin them to the always-loaded core chunk.
          if (id.includes('@oxc-project+runtime')) return 'vendor-core';
          // Same for Vite's dynamic-import preload helper: the Video.js skins
          //   import lazily too, so without this it lands in vendor-media and
          //   every lazy import in the app pulls that chunk on first paint.
          if (id.includes('vite/preload-helper')) return 'vendor-core';
          if (!id.includes('node_modules')) return;
          const chunk_groups: Record<string, string[]> = {
            'vendor-core': [
              'vue',
              'vue-router',
              'pinia',
            ],
            'vendor-data': [
              'dayjs',
              'emittery',
              'ua-parser-js',
            ],
            'vendor-http': [
              'axios',
            ],
            'vendor-media': [
              '@videojs',
            ],
            'vendor-ui': [
              'reka-ui',
              'vaul-vue',
              'class-variance-authority',
            ],
            'vendor-utils': [
              '@vueuse/core',
              'clsx',
              'tailwind-merge',
            ],
          };
          for (const [chunk, packages] of Object.entries(chunk_groups)) {
            if (packages.some((pkg) => id.includes(`/node_modules/${pkg}/`))) return chunk;
          }
        },
      },
    },
    sourcemap: false,
    target: 'es2020',
  },
  css: {
    devSourcemap: false,
    modules: false,
    // Tailwind seems to have some issues with lightningcss:
    //   https://github.com/tailwindlabs/tailwindcss/issues/14205
    // transformer: 'lightningcss',
    transformer: 'postcss',
  },
  html: {},
  plugins: [
    Tailwind(),
    ViteToml({
      namedExports: true,
    }),
    Vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => VIDEOJS_ELEMENTS.has(tag),
        },
      },
    }),
    // Only register the Vue Devtools inspector for the dev server; keep it out
    // of production builds entirely.
    ...(command === 'serve' ?
      [VueDevtools({
        componentInspector: true,
        launchEditor: 'code',
      })] :
      []),
    UnpluginComponents({
      resolvers: [
        UnpluginIconsResolver({
          alias: {
            // With this alias and prefixes disabled, icons can be used like `<icon-{name} />`
            icon: 'ph',
            // ^ but `<ricon-{name} />`
            ricon: 'ri',
          },
          enabledCollections: [
            'ri',
            'ph',
          ],
          prefix: false,
        }),
      ],
    }),
    UnpluginIcons({
      compiler: 'vue3',
      defaultClass: 'icon',
      scale: 1,
    }),
  ],
  preview: {
    open: false,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      assets: fileURLToPath(new URL('./src/assets', import.meta.url)),
      components: fileURLToPath(new URL('./src/components', import.meta.url)),
      composables: fileURLToPath(new URL('./src/composables', import.meta.url)),
      enums: fileURLToPath(new URL('./src/enums', import.meta.url)),
      lib: fileURLToPath(new URL('./src/lib', import.meta.url)),
      stores: fileURLToPath(new URL('./src/stores', import.meta.url)),
      types: fileURLToPath(new URL('./src/types', import.meta.url)),
      ui: fileURLToPath(new URL('./src/components/ui', import.meta.url)),
      utils: fileURLToPath(new URL('./src/lib/utils', import.meta.url)),
      views: fileURLToPath(new URL('./src/views', import.meta.url)),
    },
  },
}));
