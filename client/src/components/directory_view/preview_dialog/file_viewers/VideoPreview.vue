<template>
  <video
    :src='entry.url'
    controls
  />
</template>

<script setup lang='ts'>
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();
</script>

<style>
@reference '../../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__wrapper {
      & .preview-dialog__content {
        & video {
          @apply max-w-full max-h-full object-contain;
        }
      }
    }
  }
}
</style>
