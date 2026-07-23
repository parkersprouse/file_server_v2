<template>
  <DropdownMenuItem
    v-if='$is_mobile'
    @select='() => $copy()'
  >
    <icon-link />
    Copy Link
  </DropdownMenuItem>

  <PreviewDialogTooltip v-else>
    <Button
      variant='ghost'
      aria-label='Copy Link'
      class='ghost-ext h-auto!'
      @click='() => $copy()'
    >
      <icon-link />
    </Button>

    <template #content>
      Copy Link
    </template>
  </PreviewDialogTooltip>
</template>

<script setup lang='ts'>
import { useCopyLink } from 'composables/copy_link.ts';
import { useIsMobile } from 'composables/is_mobile.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $copy = useCopyLink(entry);
const $is_mobile = useIsMobile();
</script>
