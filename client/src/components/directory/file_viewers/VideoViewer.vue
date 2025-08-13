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
    <DialogContent class='video-file-dialog'>
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
        <video
          :src='toFileUrl(entry)'
          controls
        />
      </div>
    </DialogContent>
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

.video-file-dialog {
  @apply flex! flex-col! flex-nowrap! justify-start items-center! gap-0!
         max-w-[90%]! sm:max-w-xl! md:max-w-2xl! lg:max-w-4xl! xl:max-w-6xl! 2xl:max-w-7xl! max-h-[90%]!
         text-primary! p-0! bg-transparent! border-none!;

  & .file-dialog--header {
    @apply flex flex-row flex-nowrap items-center justify-end self-end grow-0 shrink px-1! pt-1!;
  }

  & .file-dialog--content {
    @apply flex flex-row flex-nowrap grow-0 shrink items-center justify-center max-w-full! max-h-full! overflow-y-auto;

    & video {
      @apply bg-black max-w-full! max-h-full! object-contain aspect-square; /* aspect-ratio: 1; */
    }
  }

  & .dialog--close {
    @apply hidden;
  }
}
</style>
