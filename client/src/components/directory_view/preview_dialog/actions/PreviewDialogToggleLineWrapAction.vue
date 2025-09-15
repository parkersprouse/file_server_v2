<template>
  <Button
    variant='ghost'
    aria-label='Toggle Line Wrap'
    class='ghost-ext h-auto!'
    :class='{ "ghost-ext--active": $store.preview_text_wrapped }'
    @click='$store.togglePreviewLineWrap()'
  >
    <ricon-text-wrap />
  </Button>
</template>

<script setup lang='ts'>
import { useStore } from 'stores/global.ts';

const $store = useStore();
</script>
