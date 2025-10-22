<template>
  <EntryItem :entry='entry'>
    hello
  </EntryItem>
</template>

<script setup lang='ts'>
// import { inject } from 'vue';

// import { absolute, relative } from 'lib/datetime.ts';
// import { fileTypeToIcon } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';
// import type { ComputedRef } from 'vue';

defineProps<{
  entry: Entry;
  thumbnail?: string;
}>();

// const heic_check = inject<ComputedRef<boolean>>('heic_check');
</script>
