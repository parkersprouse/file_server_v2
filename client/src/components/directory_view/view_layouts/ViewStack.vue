<template>
  <div
    ref='container_ref'
    :class='`entries--${mode}`'
    :style='{ height: `${virtualizer.getTotalSize()}px`, position: "relative" }'
  >
    <div
      v-for='virtual_item in virtual_items'
      :key='String(virtual_item.key)'
      :data-index='virtual_item.index'
      :data-odd='virtual_item.index % 2 === 0 ? "true" : undefined'
      :ref='(el) => virtualizer.measureElement(el as Element | null)'
      :style='{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        transform: `translateY(${virtual_item.start - scroll_margin}px)`,
      }'
      class='entry-wrapper'
    >
      <EntryItem :entry='entries[virtual_item.index]!'>
        <component
          :is='mapping[mode]'
          :entry='entries[virtual_item.index]!'
        />
      </EntryItem>
    </div>
  </div>
</template>

<script setup lang='ts'>
import { useVirtualizer } from '@tanstack/vue-virtual';
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
  const container = container_ref.value;
  const scroller = scroll_element?.value;
  if (!container || !scroller) return;
  scroll_margin.value = container.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
}

watch([container_ref, () => scroll_element?.value], update_scroll_margin, { immediate: true });

const estimate_size = computed(() => mode === 'row' ? 65 : 45);

const virtualizer = useVirtualizer(computed(() => ({
  count: entries.length,
  getScrollElement: () => scroll_element?.value ?? null,
  estimateSize: () => estimate_size.value,
  overscan: 5,
  scrollMargin: scroll_margin.value,
})));

const virtual_items = computed(() => virtualizer.value.getVirtualItems());

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
