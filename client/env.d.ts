/// <reference types="vite/client" />

/* Single home for this app's ambient type declarations: global augmentations
   and module shims (`.toml` imports, untyped ESLint plugins). Keep every
   `declare module`/`declare global` here so a shape is defined exactly once —
   duplicating an ambient `declare module` across files silently lets one copy
   win and the edited copy do nothing. */

/* eslint-disable @typescript-eslint/no-explicit-any -- required for appropriate module config */
declare global {
  import type { type } from 'prismjs';

  interface Window {
    Prism?: type;
  }
}

declare module '*.toml' {
  const content: Record<string | number, any>;
  export default content;
}

declare module '@/config.toml' {
  // `dev` is the optional `[dev]` table — a partial override applied over the
  //   top-level values while Vite runs in development mode (see config.ts).
  const config: {
    server_port: number;
    dev?: { server_port?: number; };
  };
  export default config;
}

declare module '@eslint-community/eslint-plugin-eslint-comments/configs';
declare module '@eslint/eslintrc';
declare module '@eslint/js';
declare module 'eslint-plugin-unicorn';
/* eslint-enable @typescript-eslint/no-explicit-any */
