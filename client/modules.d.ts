import type { Alpine } from 'alpinejs';

declare module '@eslint-community/eslint-plugin-eslint-comments/configs';
declare module '@eslint/eslintrc';
declare module '@eslint/js';
declare module 'eslint-plugin-unicorn';

declare global {
  interface Window { Alpine: Alpine; }
};
