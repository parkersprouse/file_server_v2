import { defineConfig } from '@rsbuild/core';
import { pluginToml } from '@rsbuild/plugin-toml';

export default defineConfig({
  html: {
    template: './src/index.html',
  },
  output: {
    distPath: {
      root: 'dist',

      assets: 'assets',
      css: '',
      cssAsync: '',
      font: 'assets',
      html: './',
      image: 'img',
      js: '',
      jsAsync: '',
      media: 'media',
      svg: 'img',
    },
  },
  plugins: [
    pluginToml(),
  ],
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
