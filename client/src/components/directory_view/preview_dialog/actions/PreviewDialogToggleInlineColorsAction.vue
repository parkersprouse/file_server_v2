<template>
  <Button
    variant='ghost'
    aria-label='Copy Text'
    class='ghost-ext h-auto!'
    :class='{ "ghost-ext--active": !$store.preview_inline_colors_disabled }'
    @click='$store.toggleInlineColorsPreview()'
  >
    <icon-swatches v-if='$store.preview_inline_colors_disabled' />
    <icon-swatches-fill v-else />
  </Button>
</template>

<script setup lang='ts'>
import { useStore } from 'stores/global.ts';

const $store = useStore();
</script>
