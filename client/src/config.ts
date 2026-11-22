import raw from '@/config.toml';

// Merge the optional `[dev]` table over the top-level values whenever the client
//   talks to actix directly rather than through Caddy, so consumers read a single
//   already-resolved `config` and never branch on mode themselves. That is
//   development mode (`import.meta.env.DEV`) and the plain-HTTP release build
//   (`vite build --mode http`, `pnpm run release:http`). The normal production
//   build (`pnpm run release`) sees neither and the base values pass through.
const direct = import.meta.env.DEV || import.meta.env.MODE === 'http';
const config = direct ?
  {
    ...raw,
    ...raw.dev,
  } :
  raw;

export { config };
export default config;
