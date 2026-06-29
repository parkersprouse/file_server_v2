/**
 * Lazy-loaded Shiki syntax highlighter (replaces the old Prism bundle).
 *
 * Performance strategy:
 *  - Fine-grained `shiki/core` build with the JavaScript RegExp engine, so there
 *    is no ~1 MB Oniguruma WASM download and startup is fast.
 *  - Nothing is imported until the first text preview is opened; the highlighter,
 *    its two themes, and each grammar are all dynamic imports that Vite splits
 *    into their own chunks.
 *  - Grammars load on demand (one chunk per language) and are cached, so only the
 *    languages actually previewed are ever fetched.
 *  - Dual-theme output (`defaultColor: false`) emits both light and dark colors
 *    as CSS variables, so switching themes — and the wrap / inline-color toggles
 *    — is pure CSS with no re-highlighting.
 */

import { bundledLanguages } from 'shiki';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

import { isLoadableLanguage, PLAINTEXT_LANG, resolveLanguage } from 'lib/highlighter/languages.ts';
import { createAutolinkTransformer, createInlineColorTransformer } from 'lib/highlighter/transformers.ts';

import type { HighlighterCore } from 'shiki/core';

export const LIGHT_THEME = 'github-light';
export const DARK_THEME = 'github-dark-dimmed';

export interface HighlightOutput {
  html: string;
  // The Shiki language id the code was highlighted as (`text` when unknown).
  language: string;
  // Whether any CSS color literal produced a swatch (mirrors Prism's flag).
  inline_colors_present: boolean;
}

let highlighter: HighlighterCore | null = null;
let highlighter_promise: Promise<HighlighterCore> | null = null;
const loaded_langs = new Set<string>();

async function ensureHighlighter(): Promise<HighlighterCore> {
  if (highlighter) {
    return highlighter;
  }
  if (highlighter_promise !== null) {
    return highlighter_promise;
  }

  highlighter_promise = createHighlighterCore({
    engine: createJavaScriptRegexEngine({ forgiving: true }),
    langs: [],
    themes: [
      import('shiki/themes/github-light.mjs'),
      import('shiki/themes/github-dark-dimmed.mjs'),
    ],
  }).then((created) => {
    highlighter = created;
    return created;
  });

  return highlighter_promise;
}

// Load a grammar chunk once, swallowing failures so highlighting degrades to
// plaintext rather than throwing on an unsupported grammar.
async function ensureLanguage(hl: HighlighterCore, lang: string): Promise<void> {
  if (lang === PLAINTEXT_LANG || loaded_langs.has(lang) || !isLoadableLanguage(lang)) {
    return;
  }
  try {
    await hl.loadLanguage(bundledLanguages[lang]);
    loaded_langs.add(lang);
  } catch {
    // Grammar failed to load/compile; caller falls back to plaintext.
  }
}

/** Eagerly warm up the highlighter (themes + engine) without highlighting yet. */
export async function preloadHighlighter(): Promise<void> {
  await ensureHighlighter();
}

/**
 * Highlight `code` for the given `filename`, returning ready-to-inject HTML plus
 * the resolved language and whether inline color swatches were produced.
 */
export async function highlightCode(code: string, filename: string): Promise<HighlightOutput> {
  const hl = await ensureHighlighter();
  const requested = resolveLanguage(filename);
  await ensureLanguage(hl, requested);

  // Fall back to plaintext if the grammar didn't actually load.
  const language = requested === PLAINTEXT_LANG || loaded_langs.has(requested) ?
    requested :
    PLAINTEXT_LANG;

  const color_state = { found: false };

  const html = hl.codeToHtml(code, {
    defaultColor: false,
    lang: language,
    themes: {
      dark: DARK_THEME,
      light: LIGHT_THEME,
    },
    transformers: [
      createInlineColorTransformer(color_state),
      createAutolinkTransformer(),
    ],
  });

  return {
    html,
    inline_colors_present: color_state.found,
    language,
  };
}
