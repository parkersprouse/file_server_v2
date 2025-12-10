<template>
  <div :class='`entries--${mode}`'>
    <EntryItem
      v-for='entry in entries'
      :key='encodeURI(entry.path)'
      :entry='entry'
    >
      <component
        :is='mapping[mode]'
        :entry='entry'
      />
    </EntryItem>
  </div>
</template>

<script setup lang='ts'>
import { computed } from 'vue';

import ListItem from '../item_layouts/ListItem.vue';
import RowItem from '../item_layouts/RowItem.vue';

import type { Entry } from 'types/entry.d.ts';

const { entries } = defineProps<{
  entries: Entry[];
  mode: 'list' | 'row';
}>();

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
