<template>
  <div class='entries--grid'>
    <EntryItem
      v-for='entry in entries'
      :key='encodeURI(entry.path)'
      :entry='entry'
    >
      <GridItem :entry='entry' />
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

.entries--grid {
  @apply w-full flex flex-row flex-wrap justify-start items-stretch gap-4;

  & .entry {
    @apply grow-0 shrink h-auto
      xl:flex-[calc(calc(calc(100%/6)-1rem)+calc(1rem/6))] xl:max-w-[calc(calc(calc(100%/6)-1rem)+calc(1rem/6))]
      lg:flex-[calc(calc(20%-1rem)+0.2rem)] lg:max-w-[calc(calc(20%-1rem)+0.2rem)]
      md:flex-[calc(calc(25%-1rem)+0.25rem)] md:max-w-[calc(calc(25%-1rem)+0.25rem)]
      sm:flex-[calc(calc(calc(100%/3)-1rem)+calc(1rem/3))] sm:max-w-[calc(calc(calc(100%/3)-1rem)+calc(1rem/3))]
      flex-[calc(calc(50%-1rem)+0.5rem)] max-w-[calc(calc(50%-1rem)+0.5rem)] min-h-[200px];

    & .entry-name {
      @apply text-sm;
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
