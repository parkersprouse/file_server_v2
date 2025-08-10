<template>
  <div class='w-full flex flex-col flex-nowrap justify-center items-stretch gap-4'>
    <EntryCard
      v-for='entry in entries'
      :key='encodeURI(entry.path)'
      :entry='entry'
      class='w-full'
    />
  </div>
</template>

<script setup lang='ts'>
import type { EntryDetails } from '@/types/entry_details.d.ts';

const { entries } = defineProps<{
  entries: EntryDetails[];
}>();
</script>
