<template>
  <Badge
    v-if='!$is_mobile'
    variant='outline'
    class='preview-dialog__title'
  >
    <icon-tag class='size-4! shrink-0!' />
    {{ entry.name }}
  </Badge>
</template>

<script setup lang='ts'>
import { useIsMobile } from 'composables/is_mobile.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $is_mobile = useIsMobile();
</script>

<style>
@reference '../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__header {
      & .preview-dialog__title {
        @apply grow-0 shrink flex flex-row flex-nowrap items-center justify-start font-normal
               text-muted-foreground w-fit max-w-full px-1.5 py-0.5 gap-2 bg-background
               whitespace-pre-line text-sm! border-t-0 border-x border-b cursor-default z-1001 hover:z-1020;
      }
    }
  }
}
</style>
