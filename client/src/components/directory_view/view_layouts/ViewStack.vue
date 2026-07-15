<template>
  <div
    ref='container_ref'
    :class='`entries--${mode}`'
    :style='{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }'
  >
    <div
      v-for='item in virtual_items'
      :key='String(item.key)'
      :data-index='item.index'
      :data-odd='item.index % 2 === 0 ? "true" : undefined'
      :ref='(el) => virtualizer.measureElement(el as Element | null)'
      :style='{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        transform: `translateY(${item.start - scroll_margin}px)`,
      }'
      class='entry-wrapper'
    >
      <EntryItem :entry='entries[item.index]!'>
        <component
          :is='mapping[mode]'
          :entry='entries[item.index]!'
        />
      </EntryItem>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { useVirtualizer } from '@tanstack/vue-virtual';
import { get, set } from '@vueuse/core';
import { computed, inject, ref, watch } from 'vue';

import ListItem from '../item_layouts/ListItem.vue';
import RowItem from '../item_layouts/RowItem.vue';

import type { Entry } from 'types/entry.d.ts';
import type { Ref } from 'vue';

const { entries, mode, scrollToIndex = -1 } = defineProps<{
  entries: Entry[];
  mode: 'list' | 'row';
  // Entry index to bring into view (the direct-linked entry; negative for none).
  scrollToIndex?: number;
}>();

const scroll_element = inject<Ref<HTMLElement | null>>('scroll_element');

const container_ref = ref<HTMLElement | null>(null);
const scroll_margin = ref<number>(0);

const estimate_size = computed(() => mode === 'row' ? 65 : 45);

const mapping = computed(() => ({
  list: ListItem,
  row: RowItem,
}));

const virtual_items = computed(() => get(virtualizer).getVirtualItems());

const virtualizer_options = computed(() => ({
  count: entries.length,
  estimateSize: (): number => get(estimate_size),
  getScrollElement: (): HTMLElement | null => get(scroll_element) ?? null,
  overscan: 3,
  scrollMargin: get(scroll_margin),
}));

const virtualizer = useVirtualizer(virtualizer_options);

// Computed once when both refs are available and never updated again.
// See ViewGrid.vue for a full explanation of why this must be one-shot.
const stopMarginWatch = watch(
  [container_ref, (): HTMLElement | null | undefined => get(scroll_element)],
  ([container, scroller]) => {
    if (!container || !scroller) return;
    set(
      scroll_margin,
      container.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop,
    );
    stopMarginWatch();
  },
  { immediate: true },
);

// Bring the direct-linked entry into view. Also depends on `scroll_margin` so
// the scroll re-runs once the one-shot margin above resolves (the virtualizer
// offsets its positions by it), and re-fires if a sort change moves the entry.
watch(
  [(): number => scrollToIndex, scroll_margin],
  async ([index]) => {
    if (index < 0) return;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    get(virtualizer).scrollToIndex(index, { align: 'center' });
  },
  { immediate: true },
);
</script>

<style>
@reference '../../../assets/styles/index.css';

.entries--list,
.entries--row {
  @apply flex w-full flex-col;
}
</style>
