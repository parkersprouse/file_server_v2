/* eslint-disable @typescript-eslint/no-explicit-any -- required for appropriate module config */
declare module '*.toml' {
  const content: Record<string | number, any>;
  export default content;
}

declare module '@/config.toml' {
  const server_port: number;
  export default { server_port };
}
/* eslint-enable @typescript-eslint/no-explicit-any */
