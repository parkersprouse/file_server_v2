<template>
  <img
    :src='entry.url'
    :class='{
      invert: $store.img_mask_inverted,
    }'
  >
</template>

<script setup lang='ts'>
import { useStore } from 'stores/global.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $store = useStore();
</script>

<style>
@reference '../../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__wrapper {
      & .preview-dialog__content {
        & img {
          @apply max-w-full max-h-full object-contain;
        }
      }
    }

    &.preview-dialog--svg {
      & .preview-dialog__wrapper {
        @apply h-full w-full;

        & .preview-dialog__content {
          @apply grow shrink;

          & img {
            @apply w-full h-full;
          }
        }
      }
    }
  }
}
</style>
