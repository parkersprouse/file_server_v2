/*
 * `localStorage` is per origin, and an installed PWA shares its origin with
 * the same site open in a browser tab, so the two would share every saved
 * preference. The browser offers no way to partition them, so the app does it
 * by key: an installed (standalone) window reads and writes `pwa:<key>`, a
 * browser tab the plain `<key>`. Every persisted value must go through
 * `storageKey`.
 *
 * The first standalone launch copies the tab's values over once, so installing
 * the app (or updating to this scheme) doesn't lose bookmarks and settings;
 * from then on the two sets are independent.
 */
const PWA_PREFIX = 'pwa:';
const SEEDED_KEY = `${PWA_PREFIX}seeded`;
const STANDALONE_MODES = ['standalone', 'window-controls-overlay', 'minimal-ui'];

function detectStandalone(): boolean {
  try {
    return navigator.standalone === true ||
      STANDALONE_MODES.some((mode) => globalThis.matchMedia(`(display-mode: ${mode})`).matches);
  } catch {
    return false;
  }
}

/**
 * Whether this window is the installed app. Read once at startup: a window
 * doesn't change kind, and the keys in use mustn't change under the stores.
 */
export const IS_STANDALONE: boolean = detectStandalone();

/** The `localStorage` key to use for `key` in this window. */
export function storageKey(key: string): string {
  return IS_STANDALONE ? `${PWA_PREFIX}${key}` : key;
}

function seedStandaloneStorage(): void {
  // Storage can be unavailable (private modes, blocked site data).
  try {
    const storage = globalThis.localStorage;
    if (storage.getItem(SEEDED_KEY) !== null) return;
    const keys = Array.from({ length: storage.length }, (_, index) => storage.key(index))
      .filter((key): key is string => key !== null && !key.startsWith(PWA_PREFIX));
    for (const key of keys) {
      const value = storage.getItem(key);
      if (value !== null && storage.getItem(PWA_PREFIX + key) === null) storage.setItem(PWA_PREFIX + key, value);
    }
    storage.setItem(SEEDED_KEY, 'true');
  } catch {
    // Nothing to seed from, or nowhere to write it.
  }
}

// At import time, so it has run before any store reads its keys.
if (IS_STANDALONE) seedStandaloneStorage();
