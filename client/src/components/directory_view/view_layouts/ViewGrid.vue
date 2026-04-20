<template>
  <div
    ref='container_ref'
    class='entries--grid'
    :style='{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }'
  >
    <div
      v-for='virtual_row in virtual_rows'
      :key='String(virtual_row.key)'
      :data-index='virtual_row.index'
      :ref='(el) => virtualizer.measureElement(el as Element | null)'
      class='entry-grid-row'
      :style='{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        transform: `translateY(${virtual_row.start - scroll_margin}px)`,
        paddingBottom: `${GAP_PX}px`,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
      }'
    >
      <EntryItem
        v-for='entry in rows[virtual_row.index]'
        :key='encodeURI(entry.path)'
        :entry='entry'
      >
        <GridItem :entry='entry' />
      </EntryItem>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { useVirtualizer } from '@tanstack/vue-virtual';
import { get, set, useElementSize } from '@vueuse/core';
import { computed, inject, ref, watch } from 'vue';

import GridItem from '../item_layouts/GridItem.vue';

import type { Entry } from 'types/entry.d.ts';
import type { Ref } from 'vue';

const { entries } = defineProps<{
  entries: Entry[];
}>();

const scroll_element = inject<Ref<HTMLElement | null>>('scroll_element');

const container_ref = ref<HTMLElement | null>(null);
const scroll_margin = ref<number>(0);

function updateScrollMargin(): void {
  const container = get(container_ref);
  const scroller = scroll_element?.value;
  if (!container || !scroller) return;
  const rect_top_diff = container.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  set(scroll_margin, rect_top_diff + scroller.scrollTop);
}

watch(
  [container_ref, (): HTMLElement | null | undefined => scroll_element?.value],
  updateScrollMargin,
  { immediate: true },
);

const GAP_PX = 16;
const GRID_ITEM_ESTIMATE_HEIGHT = 230;

const { width: scroll_width } = useElementSize(computed(() => scroll_element?.value ?? null));

const columns = computed<number>(() => {
  const w = get(scroll_width);
  if (w >= 1280) return 6; // xl+
  if (w >= 1024) return 5; // lg
  if (w >= 768) return 4; // md
  if (w >= 640) return 3; // sm
  return 2;
});

// Group entries into rows of `columns` items each
const rows = computed<Entry[][]>(() => {
  const cols = get(columns);
  const result: Entry[][] = [];
  for (let i = 0; i < entries.length; i += cols) {
    result.push(entries.slice(i, i + cols));
  }
  return result;
});

const virtualizer = useVirtualizer(computed(() => ({
  count: get(rows).length,
  getScrollElement: () => scroll_element?.value ?? null,
  estimateSize: () => GRID_ITEM_ESTIMATE_HEIGHT + GAP_PX,
  overscan: 2,
  scrollMargin: get(scroll_margin),
})));

const virtual_rows = computed(() => get(virtualizer).getVirtualItems());
</script>

<style>
@reference '../../../assets/styles/index.css';

.entries--grid {
  @apply w-full;

  & .entry-grid-row {
    @apply grid items-stretch gap-4;

    & .entry {
      @apply min-w-0 min-h-[200px];

      & .entry-title {
        @apply text-sm py-1 px-2;
      }

      & .entry-meta {
        @apply border-b-0 shrink grow-0;
      }

      & .entry-meta__last-modified {
        @apply border-l-0;
      }

      & .entry-meta__duration {
        @apply border-r-0;
      }
    }
  }
}
</style>
