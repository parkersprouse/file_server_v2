<template>
  <slot name='trigger' />
  <dialog
    ref='dialog'
    class='preview-dialog'
  >
    <div
      class='preview-dialog__wrapper'
    >
      <div
        ref='dialog_actions'
        class='preview-dialog__actions'
      >
        <a
          :href='`${file_url}?download`'
          download
          class='ghost-ext h-auto! p-1!'
        >
          <icon-download-simple class='size-5' />
        </a>
        <a
          :href='`${file_url}?inline`'
          target='_blank'
          class='ghost-ext h-auto! p-1!'
        >
          <icon-arrow-square-out class='size-5' />
        </a>
        <Button
          variant='ghost'
          class='ghost-ext h-auto! p-1!'
          @click='close'
        >
          <icon-x class='size-5' />
        </Button>
      </div>
      <div
        ref='dialog_content'
        class='preview-dialog__content'
      >
        <slot name='default' />
      </div>
    </div>
  </dialog>
</template>

<script setup lang='ts'>
import { get, onClickOutside, onKeyStroke, set, useEventListener, useMutationObserver } from '@vueuse/core';
import { computed, ref, useTemplateRef } from 'vue';

import { toFileUrl } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

defineExpose({
  open,
});

const dialog = useTemplateRef<HTMLDialogElement>('dialog');
const dialog_actions = useTemplateRef<HTMLDivElement>('dialog_actions');
const dialog_content = useTemplateRef<HTMLDivElement>('dialog_content');
const is_open = ref<boolean>(false);

const file_url = computed<string>(() => toFileUrl(entry));

function open(): void {
  get(dialog)!.showModal();
  document.body.classList.add('overflow-hidden!');
}

function close(): void {
  get(dialog)!.close();
}

onClickOutside(dialog_content, () => {
  if (get(is_open)) close();
}, { ignore: [dialog_actions] });

onKeyStroke('Escape', async () => {
  if (get(is_open)) close();
}, { dedupe: true });

useEventListener(dialog, 'close', () => {
  document.body.classList.remove('overflow-hidden!');
});

useMutationObserver(dialog, (changes) => {
  set(is_open, (changes[0].target as HTMLDialogElement).hasAttribute('open'));
}, {
  attributeFilter: ['open'],
  subtree: false,
});
</script>

<style>
@reference '../../assets/styles/index.css';

.preview-dialog {
  @apply fixed inset-0 hidden w-screen h-screen max-w-screen max-h-screen m-0 p-0 border-none z-[1000] cursor-pointer;

  &[open] {
    @apply flex flex-row flex-nowrap items-center justify-center;

    &::backdrop {
      @apply bg-black/85 z-[999] max-w-screen max-h-screen w-screen h-screen;
    }
  }

  & .preview-dialog__wrapper {
    @apply flex flex-col flex-nowrap items-center justify-center max-w-[90%] max-h-[90%] h-fit w-fit;

    & .preview-dialog__actions {
      @apply flex flex-row flex-nowrap items-center justify-center pb-1 h-fit shrink-0 grow;
    }

    & .preview-dialog__content {
      @apply flex flex-row flex-nowrap items-center justify-center grow-0 shrink
             w-auto h-auto max-w-full max-h-full overflow-auto cursor-auto;

      & img {
        @apply max-w-full max-h-full object-contain;
      }

      & video {
        @apply max-w-full max-h-full object-contain;
      }
    }
  }
}
</style>
