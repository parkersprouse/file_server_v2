import { useDark as vueUseDark } from '@vueuse/core';

import type { UseDarkOptions } from '@vueuse/core';
import type { WritableComputedRef } from 'vue';

/**
 * @example
 *   import { get } from '@vueuse/core';
 *
 *   import { useDark } from 'composables/theme.ts';
 *   ...
 *   const $is_dark = useDark();
 *   ...
 *   if (get($is_dark)) { ... }
 */
export function useDark(opts: UseDarkOptions = {}): WritableComputedRef<boolean, boolean> {
  return vueUseDark({
    attribute: 'class',
    disableTransition: true,
    initOnMounted: true,
    listenToStorageChanges: true,
    selector: 'html',
    storageKey: 'theme',
    valueDark: 'dark',
    valueLight: 'light',
    ...opts,
  });
}
