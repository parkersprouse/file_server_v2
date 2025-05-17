/* eslint-disable @typescript-eslint/no-explicit-any -- required for appropriate module config */
import type { Alpine } from 'alpinejs';

declare module '@eslint-community/eslint-plugin-eslint-comments/configs';
declare module '@eslint/eslintrc';
declare module '@eslint/js';
declare module 'eslint-plugin-unicorn';

declare global {
  interface Window { Alpine: Alpine; }
};

declare module '*.toml' {
  const content: Record<string, any>;
  export default content;
}

declare module '@/config.toml' {
  const server_url: string;
  export default { server_url };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
