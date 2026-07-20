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
import { get, useElementSize } from '@vueuse/core';
import { computed, inject, useTemplateRef } from 'vue';

import { useVirtualizedEntries } from 'composables/virtualized_entries.ts';

import GridItem from '../item_layouts/GridItem.vue';

import type { Entry } from 'types/entry.d.ts';
import type { Ref } from 'vue';

const GAP_PX = 16;
const GRID_ITEM_ESTIMATE_HEIGHT = 200;

const { entries, scrollToIndex = -1 } = defineProps<{
  entries: Entry[];
  // Entry index to bring into view (the direct-linked entry; negative for none).
  scrollToIndex?: number;
}>();

const scroll_element = inject<Ref<HTMLElement | null>>('scroll_element');

const { width: scroll_width } = useElementSize(computed(() => get(scroll_element) ?? null));

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

const container_ref = useTemplateRef<HTMLElement>('container_ref');

// The virtualizer works in rows here, so a direct-linked entry's index maps
// to the row `floor(index / columns)`.
const { scroll_margin, virtual_items: virtual_rows, virtualizer } = useVirtualizedEntries({
  container: container_ref,
  count: () => get(rows).length,
  estimateSize: () => GRID_ITEM_ESTIMATE_HEIGHT + GAP_PX,
  scrollTarget: (index) => Math.floor(index / get(columns)),
  scrollToIndex: () => scrollToIndex,
});
</script>

<style>
@reference '../../../assets/styles/index.css';

.entries--grid {
  @apply w-full;

  & .entry-grid-row {
    @apply grid items-stretch gap-4;

    & .entry {
      @apply min-w-0 h-[200px];

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
