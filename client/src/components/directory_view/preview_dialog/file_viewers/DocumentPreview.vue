<template>
  <!--
    Render documents in an <iframe> (not <object>). Script execution in the
    framed file — e.g. a malicious HTML or SVG document — is blocked by the
    server's `Content-Security-Policy: script-src 'none'` on file responses,
    NOT by an iframe `sandbox`: a strict sandbox also stops the browser's PDF
    viewer from rendering.
  -->
  <iframe :src='entry.url' />
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
  @apply h-[90%] w-[90%] p-0;

  & .preview-dialog__content {
    @apply max-w-full max-h-full w-full h-full p-0;

    & iframe {
      @apply w-full h-full overflow-auto border-0;
    }
  }
}
</style>
