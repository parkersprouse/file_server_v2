<template>
  <Popover v-if='$is_mobile'>
    <PopoverTrigger as-child>
      <Button
        variant='ghost'
        class='preview-dialog__title preview-dialog__title__trigger'
      >
        <icon-info class='size-7 sm:size-6' />
      </Button>
    </PopoverTrigger>
    <PopoverContent
      align='end'
      :align-offset='8'
      position-strategy='absolute'
      :prioritize-position='true'
      side='bottom'
      :as-child='true'
    >
      <Badge
        ref='preview_title'
        variant='outline'
        class='preview-dialog__title preview-dialog__title--compact z-[1005]'
      >
        <icon-tag />
        {{ entry.name }}
      </Badge>
    </PopoverContent>
  </Popover>
  <Badge
    v-else
    ref='preview_title'
    variant='outline'
    class='preview-dialog__title'
  >
    <icon-tag />
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
        @apply grow-0 shrink flex flex-row flex-nowrap items-center justify-start whitespace-pre-line
               text-muted-foreground w-fit max-w-full px-2 py-1 gap-2 bg-background
               border-b border-r border-zinc-300 dark:border-zinc-800;

        &.preview-dialog__title--compact {
          @apply text-foreground! bg-background border border-zinc-300 dark:border-zinc-800 p-1 gap-1
                 max-w-screen;
        }
      }

      & .preview-dialog__title__trigger {
        @apply p-1! h-auto;
      }
    }
  }
}
</style>
