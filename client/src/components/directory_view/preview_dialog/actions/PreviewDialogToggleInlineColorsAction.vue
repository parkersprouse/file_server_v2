<template>
  <PreviewDialogTooltip>
    <Button
      variant='ghost'
      aria-label='Toggle CSS Color Previews'
      class='ghost-ext h-auto!'
      :class='{ "ghost-ext--active": enabled }'
      @click='$store.toggleInlineColorsPreview()'
    >
      <icon-swatches v-if='disabled' />
      <icon-swatches-fill v-else />
    </Button>

    <template #content>
      {{ disabled ? 'Enable' : 'Disable' }} CSS Color Previews
    </template>
  </PreviewDialogTooltip>
</template>

<script setup lang='ts'>
import { computed } from 'vue';

import { useStore } from 'stores/global.ts';

const $store = useStore();

const disabled = computed<boolean>(() => $store.preview_inline_colors_disabled);
const enabled = computed<boolean>(() => !disabled.value);
</script>
