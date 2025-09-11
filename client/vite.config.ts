import { fileURLToPath } from 'node:url';

import Tailwind from '@tailwindcss/vite';
import Vue from '@vitejs/plugin-vue';
import UnpluginIconsResolver from 'unplugin-icons/resolver';
import UnpluginIcons from 'unplugin-icons/vite';
import UnpluginComponents from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';
import { ViteToml } from 'vite-plugin-toml';

// https://vite.dev/config/
export default defineConfig({
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
          isCustomElement: (tag) => tag.startsWith('media-'),
        },
      },
    }),
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
});
