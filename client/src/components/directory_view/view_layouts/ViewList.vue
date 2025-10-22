<template>
  <div class='entries--list'>
    <ItemGroup>
      <template
        v-for='(entry, index) in entries'
        :key='encodeURI(entry.path)'
      >
        <EntryItem :entry='entry'>
          <ListItem :entry='entry' />
        </EntryItem>
        <ItemSeparator v-if='index !== entries.length - 1' />
      </template>
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
  @apply flex w-full flex-col gap-4 border border-border;

  & .entry {
    & .entry-meta {
      @apply border-none;
    }

    & [data-slot='item'] {
      @apply py-2 border-none hover:bg-zinc-100 hover:dark:bg-zinc-900;
    }
  }
}
</style>
