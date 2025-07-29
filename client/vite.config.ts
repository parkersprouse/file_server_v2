import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import Tailwind from '@tailwindcss/vite';
import Vue from '@vitejs/plugin-vue';
import UnpluginIconsResolver from 'unplugin-icons/resolver';
import UnpluginIcons from 'unplugin-icons/vite';
import UnpluginComponents from 'unplugin-vue-components/vite';
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
            tailwind: [
              'tailwindcss',
              'tailwind-merge',
              'tw-animate-css',
            ],
            runtime_libs: [
              'axios',
              'dayjs',
              'pinia',
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
    },
  },
});
