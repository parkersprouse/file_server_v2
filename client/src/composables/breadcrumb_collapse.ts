import { get, set } from '@vueuse/core';
import { nextTick, ref } from 'vue';

import { useRouterStore } from 'stores/router.ts';

import type { Ref } from 'vue';

export interface BreadcrumbCollapseState {
  hidden_count: Ref<number>;
  recompute: () => Promise<void>;
}

/**
 * Determines how many leading breadcrumbs (after the root entry) must be
 *   hidden behind an overflow menu for the trail to fit within `container`'s
 *   visible width. The final crumb (the current location) always stays
 *   visible. Caller is responsible for invoking `recompute()` whenever
 *   `container` might have resized or the breadcrumb trail changed.
 *
 * @example
 *   import { get } from '@vueuse/core';
 *
 *   import { useBreadcrumbCollapse } from 'composables/breadcrumb_collapse.ts';
 *   ...
 *   const { hidden_count, recompute } = useBreadcrumbCollapse(container_ref);
 *   ...
 *   await recompute();
 *   if (get(hidden_count) > 0) { ... }
 */
export function useBreadcrumbCollapse<T extends Element>(container: Readonly<Ref<T | null>>): BreadcrumbCollapseState {
  const $router_store = useRouterStore();

  const hidden_count = ref(0);

  async function recompute(): Promise<void> {
    const el = get(container);
    if (!el) return;

    const max_hidden = Math.max($router_store.breadcrumbs.length - 1, 0);

    // Reflow from scratch every time: re-show everything, then hide crumbs
    //   one at a time (nearest the root first) until the trail no longer
    //   overflows the container. `+1` on the comparison guards against
    //   subpixel rounding falsely reporting an overflow.
    set(hidden_count, 0);
    await nextTick();

    while (get(hidden_count) < max_hidden && el.scrollWidth > el.clientWidth + 1) {
      set(hidden_count, get(hidden_count) + 1);
      await nextTick();
    }
  }

  return {
    hidden_count,
    recompute,
  };
}
