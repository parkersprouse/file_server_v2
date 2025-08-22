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
  & .preview-dialog__wrapper {
    @apply h-[90%] w-[90%];

    & .preview-dialog__content {
      @apply w-full h-full;

      & object {
        @apply w-full h-full;
      }
    }
  }
}
</style>
