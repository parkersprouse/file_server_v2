<template>
  <!--
    Render every image (including SVGs) via <img>. Unlike <object>, an <img>
    does not execute <script> embedded in an SVG, so previewing a malicious SVG
    can't run code in the server's origin.
  -->
  <img :src='entry.url'>
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
    & .preview-dialog__content {
      & img {
        @apply max-w-full max-h-full object-contain;
      }
    }

    &.preview-dialog--svg {
      & .preview-dialog__content {
        @apply h-auto w-auto grow shrink;

        & img {
          @apply w-full h-full;
        }
      }
    }
  }
}
</style>
