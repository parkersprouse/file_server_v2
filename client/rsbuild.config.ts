import { defineConfig } from '@rsbuild/core';

export default defineConfig({
  html: {
    template: './src/index.html',
  },
  resolve: {
    alias: {
      '@/': './src/',
    },
  },
  source: {
    entry: {
      index: './src/scripts/index.ts',
    },
  },
});
