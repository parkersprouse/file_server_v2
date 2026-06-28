<template>
  <DropdownMenuItem
    v-if='$is_mobile'
    :class='{
      "ghost-ext--active!": enabled
    }'
    @select='() => onClick()'
  >
    <ricon-text-wrap />
    {{ label }}
  </DropdownMenuItem>

  <PreviewDialogTooltip v-else>
    <Button
      variant='ghost'
      aria-label='Toggle Line Wrap'
      class='ghost-ext h-auto!'
      :class='{ "ghost-ext--active": enabled }'
      :aria-pressed='enabled'
      @click='() => onClick()'
    >
      <ricon-text-wrap aria-hidden='true' />
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

const enabled = computed<boolean>(() => $store.preview_text_wrapped);
const label = computed<string>(() => `${get(enabled) ? 'Disable' : 'Enable'} Line Wrap`);

function onClick(): void {
  $store.togglePreviewLineWrap();
}
</script>
