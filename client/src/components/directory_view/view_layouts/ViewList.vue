<template>
  <div class='entries--list'>
    <ItemGroup>
      <EntryItem
        v-for='entry in entries'
        :key='encodeURI(entry.path)'
        :entry='entry'
      >
        <ListItem :entry='entry' />
      </EntryItem>
    </ItemGroup>
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

.entries--list {
  @apply flex w-full flex-col gap-4;
}
</style>
