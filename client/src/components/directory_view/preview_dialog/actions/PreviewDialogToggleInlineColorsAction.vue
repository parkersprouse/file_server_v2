<template>
  <DropdownMenuItem
    v-if='$is_mobile'
    :class='{
      "ghost-ext--active!": enabled
    }'
    @select='() => onClick()'
  >
    <icon-swatches-fill v-if='enabled' />
    <icon-swatches v-else />
    {{ label }}
  </DropdownMenuItem>

  <PreviewDialogTooltip v-else>
    <Button
      variant='ghost'
      aria-label='Toggle CSS Color Previews'
      class='ghost-ext h-auto!'
      :class='{ "ghost-ext--active": enabled }'
      :aria-pressed='enabled'
      @click='() => onClick()'
    >
      <icon-swatches-fill v-if='enabled' aria-hidden='true' />
      <icon-swatches v-else aria-hidden='true' />
    </Button>

    <template #content>
      {{ label }}
    </template>
  </PreviewDialogTooltip>
</template>

<script setup lang='ts'>
import { get } from '@vueuse/core';
import { computed } from 'vue';

import { useIsMobile } from 'composables/is_mobile.ts';
import { useStore } from 'stores/global.ts';

const $is_mobile = useIsMobile();
const $store = useStore();

const enabled = computed<boolean>(() => !$store.preview_inline_colors_disabled);
const label = computed<string>(() => `${get(enabled) ? 'Disable' : 'Enable'} CSS Color Previews`);

function onClick(): void {
  $store.toggleInlineColorsPreview();
}
</script>
