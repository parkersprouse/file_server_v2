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
    <DialogScrollContent class='text-file-dialog'>
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
      <div class='file-dialog--content text-primary! bg-primary!'>
        <object
          :data='toFileUrl(entry)'
          class='w-full! h-full! text-primary! bg-primary!'
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

.text-file-dialog {
  @apply flex! flex-col! flex-nowrap! justify-between items-stretch! gap-0!
         max-w-[90%]! sm:max-w-xl! md:max-w-2xl! lg:max-w-4xl! xl:max-w-6xl! 2xl:max-w-7xl!
         text-primary! p-0! w-full! h-full! max-h-[90%]!;

  & .file-dialog--header {
    @apply flex flex-row flex-nowrap items-center justify-end self-end grow-0 shrink flex-auto px-1! pt-1!;
  }

  & .file-dialog--content {
    @apply w-full h-full grow shrink flex-auto;
  }

  & .dialog--close {
    @apply hidden;
  }
}
</style>
