import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The module decides once, at import time, which kind of window it is in.
async function load(standalone: boolean): Promise<typeof import('./storage.ts')> {
  vi.resetModules();
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: standalone && query === '(display-mode: standalone)',
  }));
  return import('./storage.ts');
}

describe('storageKey', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('leaves keys alone in a browser tab', async () => {
    localStorage.setItem('view', 'grid');
    const { IS_STANDALONE, storageKey } = await load(false);

    expect(IS_STANDALONE).toBe(false);
    expect(storageKey('view')).toBe('view');
    expect(localStorage.length).toBe(1);
  });

  it('namespaces keys in an installed window', async () => {
    const { IS_STANDALONE, storageKey } = await load(true);

    expect(IS_STANDALONE).toBe(true);
    expect(storageKey('view')).toBe('pwa:view');
  });

  it('copies the tab\'s values over on the first installed launch only', async () => {
    localStorage.setItem('view', 'grid');
    await load(true);
    expect(localStorage.getItem('pwa:view')).toBe('grid');

    // From here on the two sets are independent, in both directions.
    localStorage.setItem('pwa:view', 'row');
    localStorage.setItem('view', 'list');
    localStorage.setItem('sort_key', 'size');
    await load(true);

    expect(localStorage.getItem('pwa:view')).toBe('row');
    expect(localStorage.getItem('view')).toBe('list');
    expect(localStorage.getItem('pwa:sort_key')).toBeNull();
  });
});
