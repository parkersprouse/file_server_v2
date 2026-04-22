/**
 * Lazy-loaded Prism.js syntax highlighter
 * Loaded only when text preview is opened
 */

let prism_loaded = false;
let prism_load_promise: Promise<void> | null = null;

export async function ensurePrismLoaded(): Promise<void> {
  if (prism_loaded) {
    return;
  }

  if (prism_load_promise !== null) {
    return prism_load_promise;
  }

  prism_load_promise = (async (): Promise<void> => {
    await import('@/vendor/prism/prism.min.js');
    prism_loaded = true;
  })();

  return prism_load_promise;
}

export function getPrism(): typeof window.Prism | null {
  if (!prism_loaded) {
    return null;
  }
  return window.Prism;
}
