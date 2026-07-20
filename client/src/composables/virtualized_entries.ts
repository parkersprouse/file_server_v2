import { useVirtualizer } from '@tanstack/vue-virtual';
import { get, set } from '@vueuse/core';
import { computed, inject, watch, ref } from 'vue';

import type { VirtualItem, Virtualizer } from '@tanstack/vue-virtual';
import type { ComputedRef, Ref, ShallowRef } from 'vue';

export interface UseVirtualizedEntriesOptions {
  /** The layout's own container element (its `useTemplateRef`). */
  container: Readonly<ShallowRef<HTMLElement | null>>;
  /** Number of virtualized rows (reactive getter). */
  count: () => number;
  /** Estimated row height in px. */
  estimateSize: () => number;
  /**
   * Map an entry index to the virtualizer row that contains it. Defaults to
   * identity; the grid maps to `floor(index / columns)`.
   */
  scrollTarget?: (index: number) => number;
  /** Entry index to bring into view (the direct-linked entry; negative for none). */
  scrollToIndex: () => number;
}

export interface UseVirtualizedEntriesReturn {
  scroll_margin: Ref<number>;
  virtual_items: ComputedRef<VirtualItem[]>;
  virtualizer: Ref<Virtualizer<HTMLElement, Element>>;
}

/**
 * The virtualizer wiring shared by the directory view layouts
 * (`ViewStack`/`ViewGrid`): the `@tanstack/vue-virtual` setup against the
 * injected scroll element, the one-shot `scroll_margin` measurement, and the
 * scroll-into-view behavior for a direct-linked entry.
 */
export function useVirtualizedEntries(options: UseVirtualizedEntriesOptions): UseVirtualizedEntriesReturn {
  const scroll_element = inject<Ref<HTMLElement | null>>('scroll_element');

  const scroll_margin = ref<number>(0);

  const virtualizer_options = computed(() => ({
    count: options.count(),
    estimateSize: options.estimateSize,
    getScrollElement: (): HTMLElement | null => get(scroll_element) ?? null,
    overscan: 3,
    scrollMargin: get(scroll_margin),
  }));

  const virtualizer = useVirtualizer(virtualizer_options);

  const virtual_items = computed(() => get(virtualizer).getVirtualItems());

  // Computed once when both refs are available and never updated again.
  // scroll_margin is a static layout offset - the distance from the top of the
  // scroll element to the top of the virtualized container. It doesn't change
  // as the user scrolls, and re-computing it on every measurement cycle causes
  // a feedback loop that makes rows jitter when scrolling upward through
  // unmeasured items.
  const stop_margin_watch = watch(
    [options.container, (): HTMLElement | null | undefined => get(scroll_element)],
    ([container, scroller]) => {
      if (!container || !scroller) return;
      set(
        scroll_margin,
        container.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop,
      );
      stop_margin_watch();
    },
    { immediate: true },
  );

  // Bring the direct-linked entry into view. Also depends on `scroll_margin`
  // so the scroll re-runs once the one-shot margin above resolves (the
  // virtualizer offsets its positions by it), and re-fires if a sort change
  // moves the entry.
  watch(
    [(): number => options.scrollToIndex(), scroll_margin],
    async ([index]) => {
      if (index < 0) return;
      await new Promise((resolve) => requestAnimationFrame(resolve));
      get(virtualizer).scrollToIndex(options.scrollTarget?.(index) ?? index, { align: 'center' });
    },
    { immediate: true },
  );

  return {
    scroll_margin,
    virtual_items,
    virtualizer,
  };
}
