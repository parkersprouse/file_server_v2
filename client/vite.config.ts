import { fileURLToPath } from 'node:url';

import Tailwind from '@tailwindcss/vite';
import Vue from '@vitejs/plugin-vue';
import UnpluginIconsResolver from 'unplugin-icons/resolver';
import UnpluginIcons from 'unplugin-icons/vite';
import UnpluginComponents from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import { ViteToml } from 'vite-plugin-toml';
import VueDevTools from 'vite-plugin-vue-devtools';

// https://vite.dev/config/
export default defineConfig({
  appType: 'spa',
  build: {
    assetsDir: '.',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        // Manually define the chunks that dependencies will be bundled
        //   into to ensure they stay under acceptable size limits.
        manualChunks: {
          runtime_libs: [
            'axios',
            'dayjs',
            'pinia',
          ],
          tailwind: [
            'tailwindcss',
            'tailwind-merge',
            'tw-animate-css',
          ],
          vue: [
            '@vueuse/core',
            'vue',
            'vue-router',
          ],
        },
      },
    },
    sourcemap: true,
    target: 'es2020',
  },
  css: {
    devSourcemap: true,
    modules: false,
    transformer: 'lightningcss',
  },
  html: {},
  plugins: [
    VueDevTools({
      launchEditor: 'code',
    }),
    ViteToml({ namedExports: true }),
    Vue(),
    Tailwind(),
    UnpluginComponents({
      resolvers: [
        UnpluginIconsResolver({
          // With this alias and prefixes disabled, icons can be used like `<icon-{name} />`
          alias: {
            icon: 'ph',
          },
          enabledCollections: ['ph'],
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
});
