/* eslint-disable @typescript-eslint/no-explicit-any -- required for appropriate module config */
declare module '*.toml' {
  const content: Record<string, any>;
  export default content;
}

declare module '@/config.toml' {
  const server_url: string;
  export default { server_url };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
