<template>
  <Dialog>
    <DialogTrigger as-child>
      <a
        href='#'
        class='entry'
      >
        <slot name='default' />
      </a>
    </DialogTrigger>
    <DialogScrollContent class='audio-file-dialog'>
      <DialogHeader class='file-dialog--header'>
        <VisuallyHidden>
          <DialogTitle />
          <DialogDescription />
        </VisuallyHidden>
        <a
          :href='`${toFileUrl(entry)}?download`'
          download
          class='ghost-ext h-auto! p-1!'
        >
          <icon-download-simple class='size-4' />
        </a>
        <DialogClose>
          <Button
            variant='ghost'
            class='ghost-ext h-auto! p-1!'
          >
            <icon-x class='size-4' />
          </Button>
        </DialogClose>
      </DialogHeader>
      <div class='file-dialog--content'>
        <audio
          :src='toFileUrl(entry)'
          controls
          class='max-w-full max-h-full w-full h-auto object-contain'
        />
      </div>
    </DialogScrollContent>
  </Dialog>
</template>

<script setup lang='ts'>
import { VisuallyHidden } from 'reka-ui';

import { toFileUrl } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();
</script>

<style>
@reference '../../../assets/styles/index.css';

.audio-file-dialog {
  @apply flex! flex-col! flex-nowrap! justify-between items-center! gap-0!
         max-w-[90%]! sm:max-w-xl! md:max-w-2xl! lg:max-w-4xl! xl:max-w-6xl! 2xl:max-w-7xl! w-full!
         text-primary! p-0! bg-transparent! border-none!;

  & .file-dialog--header {
    @apply flex flex-row flex-nowrap items-center justify-end self-end grow-0 shrink flex-auto px-1! pt-1!;
  }

  & .file-dialog--content {
    @apply w-full h-auto grow shrink flex-auto;
  }

  & .dialog--close {
    @apply hidden;
  }
}
</style>
