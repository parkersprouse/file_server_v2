<template>
  <div class='entries--row'>
    <EntryItem
      v-for='entry in entries'
      :key='encodeURI(entry.path)'
      :entry='entry'
    >
      <RowItem :entry='entry' />
    </EntryItem>
  </div>
</template>

<script setup lang='ts'>
import type { Entry } from 'types/entry.d.ts';

const { entries } = defineProps<{
  entries: Entry[];
}>();
</script>

<style>
@reference '../../../assets/styles/index.css';

.entries--row {
  @apply flex w-full flex-col;
}
</style>
