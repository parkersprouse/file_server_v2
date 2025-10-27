<template>
  <PreviewDialogTooltip>
    <Button
      variant='ghost'
      aria-label='Toggle Line Wrap'
      class='ghost-ext h-auto!'
      :class='{ "ghost-ext--active": enabled }'
      @click='$store.togglePreviewLineWrap()'
    >
      <ricon-text-wrap />
    </Button>

    <template #content>
      {{ enabled ? 'Disable' : 'Enable' }} Line Wrap
    </template>
  </PreviewDialogTooltip>
</template>

<script setup lang='ts'>
import { computed } from 'vue';

import { useStore } from 'stores/global.ts';

const $store = useStore();

const enabled = computed<boolean>(() => $store.preview_text_wrapped);
</script>
