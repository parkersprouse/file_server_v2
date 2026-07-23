import raw from '@/config.toml';

// Merge the optional `[dev]` table over the top-level values when Vite runs in
//   development mode (`import.meta.env.DEV`), so consumers read a single already-
//   resolved `config` and never branch on mode themselves. Any production build
//   (`vite build`, incl. `pnpm run release`) sees `DEV === false` and the base
//   values pass through untouched.
const config = import.meta.env.DEV ?
  {
    ...raw,
    ...raw.dev,
  } :
  raw;

export { config };
export default config;
