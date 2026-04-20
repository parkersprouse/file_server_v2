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

const { entries, mode } = defineProps<{
  entries: Entry[];
  mode: 'list' | 'row';
}>();

const scroll_element = inject<Ref<HTMLElement | null>>('scroll_element');

const container_ref = ref<HTMLElement | null>(null);
const scroll_margin = ref<number>(0);

function update_scroll_margin(): void {
  const container = get(container_ref);
  const scroller = scroll_element?.value;
  if (!container || !scroller) return;
  const rect_top_diff = container.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
  set(scroll_margin, rect_top_diff + scroller.scrollTop);
}

watch(
  [container_ref, (): HTMLElement | null | undefined => scroll_element?.value],
  update_scroll_margin,
  { immediate: true },
);

const estimate_size = computed(() => mode === 'row' ? 65 : 45);

const virtualizer = useVirtualizer(computed(() => ({
  count: entries.length,
  getScrollElement: () => scroll_element?.value ?? null,
  estimateSize: () => get(estimate_size),
  overscan: 5,
  scrollMargin: get(scroll_margin),
})));

const virtual_items = computed(() => get(virtualizer).getVirtualItems());

const mapping = computed(() => ({
  list: ListItem,
  row: RowItem,
}));
</script>

<style>
@reference '../../../assets/styles/index.css';

.entries--list,
.entries--row {
  @apply flex w-full flex-col;
}
</style>
