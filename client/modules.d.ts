/* eslint-disable @typescript-eslint/no-explicit-any -- required for appropriate module config */
declare global {
  import type { type } from 'prismjs';

  interface Window {
    Prism?: type;
  }
}

declare module '*.toml' {
  const content: Record<string, any>;
  export default content;
}

declare module '@/config.toml' {
  const server_port: number;
  export default { server_port };
}

declare module '@eslint-community/eslint-plugin-eslint-comments/configs';
declare module '@eslint/eslintrc';
declare module '@eslint/js';
declare module 'eslint-plugin-unicorn';

/* eslint-enable @typescript-eslint/no-explicit-any */
