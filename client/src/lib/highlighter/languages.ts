/**
 * Maps a file name (by extension) to a Shiki bundled-language id.
 *
 * Shiki keys its lazy grammar map (`bundledLanguages`) by canonical id *and*
 * common aliases (`js`, `ts`, `py`, ...). We keep an explicit table for the
 * cases where the file extension differs from any Shiki key (e.g. `.mjs` ->
 * `javascript`, `.h` -> `c`), then fall back to "is the bare extension a known
 * Shiki key?" and finally to plain text.
 */

import { bundledLanguages } from 'shiki';

// Shiki's special non-grammar id for "no highlighting". Always available without
// loading a grammar chunk, so it doubles as our safe fallback.
export const PLAINTEXT_LANG = 'text';

// Extension (lower-cased, no leading dot) -> Shiki language id. Only entries
// whose extension is NOT already a valid Shiki key need to live here; everything
// else is resolved by the bare-extension fallback below.
/* eslint-disable sort-keys -- grouped by language family rather than alphabetised, for readability */
const EXTENSION_TO_LANG: Record<string, string> = {
  // JS / TS family
  cjs: 'javascript',
  cts: 'typescript',
  htm: 'html',
  mdown: 'markdown',
  mjs: 'javascript',
  mkd: 'markdown',
  mts: 'typescript',
  svg: 'xml',

  // C family
  cc: 'cpp',
  cxx: 'cpp',
  'h++': 'cpp',
  h: 'c',
  hh: 'cpp',
  hpp: 'cpp',
  hxx: 'cpp',

  // Shells / config
  bash: 'bash',
  cfg: 'ini',
  cmd: 'bat',
  conf: 'ini',
  gql: 'graphql',
  htaccess: 'apache',
  kts: 'kotlin',
  zsh: 'bash',

  // Misc languages where the extension isn't a Shiki key
  cljc: 'clojure',
  cljs: 'clojure',
  ex: 'elixir',
  exs: 'elixir',
  gradle: 'groovy',
  jl: 'julia',
  patch: 'diff',
  pm: 'perl',
  rake: 'ruby',
  vim: 'viml',

  // Plain text-ish
  log: PLAINTEXT_LANG,
  text: PLAINTEXT_LANG,
  txt: PLAINTEXT_LANG,
};

// A handful of extension-less filenames that still have grammars.
const FILENAME_TO_LANG: Record<string, string> = {
  dockerfile: 'docker',
  gemfile: 'ruby',
  makefile: 'make',
  rakefile: 'ruby',
};
/* eslint-enable sort-keys */

function extensionOf(name: string): string {
  const dot = name.lastIndexOf('.');
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : '';
}

/**
 * Resolve the Shiki language id to highlight `filename` with. Returns
 * {@link PLAINTEXT_LANG} when the type is unknown so highlighting never throws.
 */
export function resolveLanguage(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower in FILENAME_TO_LANG) {
    return FILENAME_TO_LANG[lower];
  }

  const ext = extensionOf(filename);
  if (!ext) {
    return PLAINTEXT_LANG;
  }
  if (ext in EXTENSION_TO_LANG) {
    return EXTENSION_TO_LANG[ext];
  }
  // The bare extension is often a valid Shiki id/alias (js, ts, py, rs, go, ...).
  if (ext in bundledLanguages) {
    return ext;
  }
  return PLAINTEXT_LANG;
}

/** Whether `lang` has a loadable grammar (i.e. isn't our plaintext fallback). */
export function isLoadableLanguage(lang: string): lang is keyof typeof bundledLanguages {
  return lang !== PLAINTEXT_LANG && lang in bundledLanguages;
}
