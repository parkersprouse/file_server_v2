import { get, useCssVar, useMediaQuery } from '@vueuse/core';
import { computed } from 'vue';

import type { ComputedRef } from 'vue';

/*
 * Default breakpoint values:
 *   --breakpoint-sm: 40rem;
 *   --breakpoint-md: 48rem;
 *   --breakpoint-lg: 64rem;
 *   --breakpoint-xl: 80rem;
 *   --breakpoint-2xl: 96rem;
 */
const DEFAULT_BREAKPOINT = '768px';

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

  // The rem threshold is evaluated by the browser as a media query, which is
  // exactly how Tailwind's `md:` breakpoint resolves it — so this can't
  // drift from where the CSS actually breaks.
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- an absent CSS var reads as ''
  const breakpoint_query = computed(() => `(width < ${get(breakpoint_var) || DEFAULT_BREAKPOINT})`);
  const below_breakpoint = useMediaQuery(breakpoint_query);

  return computed(() => get(cannot_hover) || get(below_breakpoint));
}
