<template>
  <object
    v-if='is_svg'
    :data='entry.url'
    type='image/svg+xml'
  />
  <img
    v-else
    :src='entry.url'
  >
</template>

<script setup lang='ts'>
import { computed } from 'vue';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const is_svg = computed<boolean>(() => entry.name.endsWith('.svg'));
</script>

<style>
@reference '../../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__content {
      & img {
        @apply max-w-full max-h-full object-contain;
      }
    }

    &.preview-dialog--svg {
      & .preview-dialog__content {
        @apply h-auto w-auto grow shrink;

        & object {
          @apply w-full h-full;
        }
      }
    }
  }
}
</style>
