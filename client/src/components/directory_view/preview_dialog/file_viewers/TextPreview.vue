<template>
  <pre
    :data-src='entry.url'
    data-toolbar-order='copy-to-clipboard,show-language'
    class='match-braces line-numbers'
  />
</template>

<script setup lang='ts'>
import { onMounted } from 'vue';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

onMounted(() => {
  window.Prism.plugins.fileHighlight.highlight();
});
</script>

<style>
@reference '../../../../assets/styles/index.css';

.preview-dialog--text {
  & .preview-dialog__content {
    @apply h-[90%] w-[90%] bg-accent text-primary overflow-hidden p-0;

    & > div,
    & > object {
      @apply w-full h-full overflow-auto;
    }

    & pre {
      @apply font-mono h-full w-full m-0;
    }
  }
}
</style>
