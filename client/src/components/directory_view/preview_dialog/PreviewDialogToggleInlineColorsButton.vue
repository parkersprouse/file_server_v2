<template>
  <Button
    variant='ghost'
    aria-label='Copy Text'
    class='ghost-ext h-auto!'
    @click='$store.toggleInlineColorsPreview()'
  >
    <icon-palette v-if='$store.preview_inline_colors_disabled' />
    <icon-palette-fill v-else />
  </Button>
</template>

<script setup lang='ts'>
import { useStore } from 'stores/global.ts';

const $store = useStore();
</script>
