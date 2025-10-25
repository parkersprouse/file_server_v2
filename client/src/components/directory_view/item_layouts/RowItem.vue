<template>
  <EntryItem :entry='entry'>
    <!--
      <img
        v-if='thumbnail && heic_check'
        :src='thumbnail'
        class='w-auto h-auto object-contain aspect-square'
      >
    -->
    hello
  </EntryItem>
</template>

<script setup lang='ts'>
// import { inject } from 'vue';

// import { absolute, relative } from 'lib/datetime.ts';
// import { fileTypeToIcon } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
  thumbnail?: string;
}>();

// const heic_check = inject<boolean>('heic_check', false);
</script>
