import { get, useCssVar, useWindowSize, useMediaQuery } from '@vueuse/core';
import { computed } from 'vue';

import type { ComputedRef } from 'vue';

/*
  --breakpoint-sm: 40rem;
  --breakpoint-md: 48rem;
  --breakpoint-lg: 64rem;
  --breakpoint-xl: 80rem;
  --breakpoint-2xl: 96rem;
*/
const DEFAULT_BREAKPOINT = 768;

/**
 * @example
 *   import { get } from '@vueuse/core';
 *
 *   import { useIsMobile } from 'composables/is_mobile.ts';
 *   ...
 *   const $is_mobile = useIsMobile();
 *   ...
 *   if (get($is_mobile)) { ... }
 */
export function useIsMobile(): ComputedRef<boolean> {
  const cannot_hover = useMediaQuery('not (hover: hover)');
  const breakpoint_var = useCssVar('--breakpoint-md', null, { observe: true });
  const { width } = useWindowSize();
  const is_mobile = computed(() => {
    const breakpoint = Number(get(breakpoint_var)) || DEFAULT_BREAKPOINT;
    return (get(width) < breakpoint) || get(cannot_hover);
  });
  return is_mobile;
}
