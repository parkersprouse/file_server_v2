<template>
  <div
    ref='container_ref'
    class='entries--grid'
    :style='{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }'
  >
    <div
      v-for='virtual_item in virtual_items'
      :key='String(virtual_item.key)'
      :data-index='virtual_item.index'
      :ref='(el) => virtualizer.measureElement(el as Element | null)'
      class='entry-grid-cell'
      :style='{
        position: "absolute",
        top: 0,
        left: `calc(${virtual_item.lane} * (100% / ${columns} + ${GAP_PX / columns}px))`,
        width: `calc(100% / ${columns} - ${GAP_PX * (columns - 1) / columns}px)`,
        transform: `translateY(${virtual_item.start - scroll_margin}px)`,
        paddingBottom: `${GAP_PX}px`,
      }'
    >
      <EntryItem :entry='entries[virtual_item.index]!'>
        <GridItem :entry='entries[virtual_item.index]!' />
      </EntryItem>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { useVirtualizer } from '@tanstack/vue-virtual';
import { useElementSize } from '@vueuse/core';
import { computed, inject, ref, watch } from 'vue';

import GridItem from '../item_layouts/GridItem.vue';

import type { Ref } from 'vue';
import type { Entry } from 'types/entry.d.ts';

const { entries } = defineProps<{
  entries: Entry[];
}>();

const scroll_element = inject<Ref<HTMLElement | null>>('scroll_element');

const container_ref = ref<HTMLElement | null>(null);
const scroll_margin = ref<number>(0);

function update_scroll_margin(): void {
  const container = container_ref.value;
  const scroller = scroll_element?.value;
  if (!container || !scroller) return;
  scroll_margin.value = container.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
}

watch([container_ref, () => scroll_element?.value], update_scroll_margin, { immediate: true });

const GAP_PX = 16;
const GRID_ITEM_ESTIMATE_HEIGHT = 230;

const { width: scroll_width } = useElementSize(computed(() => scroll_element?.value ?? null));

const columns = computed<number>(() => {
  const w = scroll_width.value;
  if (w >= 1280) return 6; // xl+
  if (w >= 1024) return 5; // lg
  if (w >= 768) return 4;  // md
  if (w >= 640) return 3;  // sm
  return 2;
});

const virtualizer = useVirtualizer(computed(() => ({
  count: entries.length,
  getScrollElement: () => scroll_element?.value ?? null,
  estimateSize: () => GRID_ITEM_ESTIMATE_HEIGHT + GAP_PX,
  lanes: columns.value,
  overscan: 2,
  scrollMargin: scroll_margin.value,
})));

const virtual_items = computed(() => virtualizer.value.getVirtualItems());
</script>

<style>
@reference '../../../assets/styles/index.css';

.entries--grid {
  @apply w-full;

  & .entry-grid-cell {
    & .entry {
      @apply h-full;
    }
  }

  & .entry {
    @apply grow-0 shrink h-auto min-h-[200px];

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
</style>
