<template>
  <slot name='trigger' />
  <dialog
    ref='dialog'
    class='preview-dialog'
    :class='class_root'
  >
    <div
      class='preview-dialog__wrapper'
      :class='class_wrapper'
    >
      <div
        ref='dialog_actions'
        class='preview-dialog__actions'
        :class='class_actions'
      >
        <slot name='actions_start' />
        <a
          aria-label='Download file'
          :href='`${entry.url}?download`'
          download
          class='ghost-ext h-auto! p-1!'
        >
          <icon-download-simple />
        </a>
        <a
          aria-label='Open file in new tab'
          :href='`${entry.url}?inline`'
          target='_blank'
          class='ghost-ext h-auto! p-1!'
        >
          <icon-arrow-square-out />
        </a>
        <Button
          aria-label='Close file preview'
          variant='ghost'
          class='ghost-ext h-auto! p-1!'
          @click='close'
        >
          <icon-x />
        </Button>
        <slot name='actions_end' />
      </div>
      <div
        ref='dialog_content'
        class='preview-dialog__content'
        :class='class_content'
      >
        <slot name='default' />
      </div>
    </div>
  </dialog>
</template>

<script setup lang='ts'>
// , useEventListener, useMutationObserver
import { get, onClickOutside, onKeyStroke, set } from '@vueuse/core';
import { ref, useTemplateRef } from 'vue';

import type { Entry } from 'types/entry.d.ts';

const {
  class_actions = '',
  class_content = '',
  class_root = '',
  class_wrapper = '',
  entry,
} = defineProps<{
  entry: Entry;
  class_actions?: string;
  class_content?: string;
  class_root?: string;
  class_wrapper?: string;
}>();

defineExpose({
  open,
});

const dialog = useTemplateRef<HTMLDialogElement>('dialog');
const dialog_actions = useTemplateRef<HTMLDivElement>('dialog_actions');
const dialog_content = useTemplateRef<HTMLDivElement>('dialog_content');
const is_open = ref<boolean>(false);

function open(): void {
  const dialog_ele = get(dialog);
  if (!dialog_ele) return;
  dialog_ele.showModal();
  document.body.classList.add('overflow-hidden!');
  set(is_open, true);
}

function close(): void {
  const dialog_ele = get(dialog);
  if (!dialog_ele) return;
  dialog_ele.close();
  document.body.classList.remove('overflow-hidden!');
  set(is_open, false);
}

onClickOutside(dialog_content, () => {
  if (get(is_open)) close();
}, { ignore: [dialog_actions] });

onKeyStroke('Escape', async () => {
  if (get(is_open)) close();
}, { dedupe: true });

// useEventListener(dialog, 'close', () => {
//   document.body.classList.remove('overflow-hidden!');
// });

// useMutationObserver(dialog, (changes) => {
//   set(is_open, (changes[0].target as HTMLDialogElement).hasAttribute('open'));
// }, {
//   attributeFilter: ['open'],
//   subtree: false,
// });
</script>

<style>
@reference '../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    @apply fixed inset-0 hidden w-screen h-screen max-w-screen max-h-screen m-0 p-0 border-none z-[1000] cursor-pointer;

    &[open] {
      @apply flex flex-row flex-nowrap items-center justify-center;

      &::backdrop {
        @apply bg-black/85 z-[999] max-w-screen max-h-screen w-screen h-screen;
      }
    }

    & .preview-dialog__wrapper {
      @apply flex flex-col flex-nowrap items-center justify-center max-w-screen max-h-screen h-auto w-auto;

      & .preview-dialog__actions {
        @apply flex flex-row flex-nowrap items-center justify-center py-1 h-fit shrink grow-0 gap-1 sm:gap-0;

        & svg.icon {
          @apply size-7 sm:size-5;
        }

        & a,
        & button {
          @apply text-muted-foreground;

          @variant hover {
            @apply text-primary;
          }
        }
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

        & object {
          @apply w-full h-full max-w-full max-h-full;
        }
      }
    }
  }
}
</style>
