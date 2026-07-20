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
import { get } from '@vueuse/core';
import { computed, useTemplateRef } from 'vue';

import { useVirtualizedEntries } from 'composables/virtualized_entries.ts';

import ListItem from '../item_layouts/ListItem.vue';
import RowItem from '../item_layouts/RowItem.vue';

import type { Entry } from 'types/entry.d.ts';

const { entries, mode, scrollToIndex = -1 } = defineProps<{
  entries: Entry[];
  mode: 'list' | 'row';
  // Entry index to bring into view (the direct-linked entry; negative for none).
  scrollToIndex?: number;
}>();

const estimate_size = computed(() => mode === 'row' ? 65 : 45);

const mapping = {
  list: ListItem,
  row: RowItem,
};

const container_ref = useTemplateRef<HTMLElement>('container_ref');

const { scroll_margin, virtual_items, virtualizer } = useVirtualizedEntries({
  container: container_ref,
  count: () => entries.length,
  estimateSize: () => get(estimate_size),
  scrollToIndex: () => scrollToIndex,
});
</script>

<style>
@reference '../../../assets/styles/index.css';

.entries--list,
.entries--row {
  @apply flex w-full flex-col;
}
</style>
