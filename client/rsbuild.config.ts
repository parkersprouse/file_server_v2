import { defineConfig } from '@rsbuild/core';
import { pluginToml } from '@rsbuild/plugin-toml';
import { pluginEjs } from 'rsbuild-plugin-ejs';
import { pluginHtmlMinifierTerser } from 'rsbuild-plugin-html-minifier-terser';

export default defineConfig({
  dev: {
    hmr: true,
    liveReload: true,
    watchFiles: {
      options: {
        awaitWriteFinish: true,
      },
      paths: [
        'rsbuild.config.*',
        'src/**/*.ejs',
      ],
      type: 'reload-server',
    },
  },
  html: {
    template: './src/index.ejs',
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
    sourceMap: {
      css: process.env.NODE_ENV === 'production',
      js: process.env.NODE_ENV === 'production' ? 'source-map' : false,
    },
    target: 'web',
  },
  plugins: [
    pluginToml(),
    pluginEjs({
      ejsOptions: {
        beautify: false,
        views: ['./src/views'],
      },
    }),
    pluginHtmlMinifierTerser({
      quoteCharacter: "'",
    }),
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
