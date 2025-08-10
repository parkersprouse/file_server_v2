<template>
  <div class='entries--grid'>
    <EntryCard
      v-for='entry in entries'
      :key='encodeURI(entry.path)'
      :entry='entry'
    />
  </div>
</template>

<script setup lang='ts'>
import type { EntryDetails } from '@/types/entry_details.d.ts';

const { entries } = defineProps<{
  entries: EntryDetails[];
}>();
</script>

<style>
@reference '../../assets/styles/index.css';

.entries--grid {
  /* @apply mx-auto w-full sm:w-xl md:w-2xl lg:w-4xl xl:w-6xl 2xl:w-7xl; */
  @apply w-full flex flex-row flex-wrap justify-start items-stretch gap-4;

  & .entry {
    @apply flex-[calc(calc(25%-1rem)+0.25rem)] w-[calc(calc(25%-1rem)+0.25rem)] grow-0 shrink min-h-[250px];
  }
}
</style>
