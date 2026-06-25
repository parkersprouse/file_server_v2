<template>
  <!--
    Render documents in a sandboxed <iframe> rather than <object>. An empty
    `sandbox` applies all restrictions (no script execution, no same-origin), so
    previewing a document that embeds <script> (e.g. an HTML or SVG document)
    can't run code, while the browser still renders PDFs/images natively.
  -->
  <iframe
    :src='entry.url'
    sandbox=''
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
