/* eslint-disable @typescript-eslint/no-explicit-any -- required for appropriate module config */
declare module '@eslint-community/eslint-plugin-eslint-comments/configs';
declare module '@eslint/eslintrc';
declare module '@eslint/js';
declare module 'eslint-plugin-unicorn';
declare module '@highlightjs*';
declare module 'highlightjs*';

declare module '*.toml' {
  const content: Record<string, any>;
  export default content;
}

declare module '@/config.toml' {
  const server_url: string;
  export default { server_url };
}

// declare global {
declare interface Window {
  hljs?: any;
}
// }
/* eslint-enable @typescript-eslint/no-explicit-any */
