<template>
  <PreviewDialogTooltip>
    <Button
      variant='ghost'
      aria-label='Toggle Markdown Rendering'
      class='ghost-ext h-auto!'
      :aria-pressed='rendered'
      @click='$store.toggleMarkdownRendered()'
    >
      <icon-code v-if='rendered' aria-hidden='true' />
      <icon-eye v-else aria-hidden='true' />
    </Button>

    <template #content>
      {{ rendered ? 'View Source' : 'View Preview' }}
    </template>
  </PreviewDialogTooltip>
</template>

<script setup lang='ts'>
import { computed } from 'vue';

import { useStore } from 'stores/global.ts';

const $store = useStore();

const rendered = computed<boolean>(() => $store.preview_markdown_rendered);
</script>
