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
import type { Entry } from 'types/entry.d.ts';

const { entries } = defineProps<{
  entries: Entry[];
}>();
</script>
