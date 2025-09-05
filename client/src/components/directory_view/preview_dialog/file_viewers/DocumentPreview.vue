<template>
  <object :data='entry.url' />
</template>

<script setup lang='ts'>
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();
</script>

<style>
@reference '../../../../assets/styles/index.css';

.preview-dialog--doc {
  & .preview-dialog__content {
    @apply h-[90%] w-[90%] p-0;

    & object {
      @apply w-full h-full;
    }
  }
}
</style>
