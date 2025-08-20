<template>
  <dialog
    v-if='entry'
    ref='dialog'
    :class='cn("preview-dialog", props.class)'
  >
    <PreviewDialogContent @close='async () => await close()'>
      <slot name='default' />
    </PreviewDialogContent>

    <PreviewDialogActions :entry='entry'>
      <slot name='actions_start' />
      <slot name='actions_end' />
    </PreviewDialogActions>
  </dialog>
</template>

<script setup lang='ts'>
import { get, onKeyStroke, set, useMutationObserver } from '@vueuse/core';
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { cn } from 'lib/utils.ts';

import type { Entry } from 'types/entry.d.ts';
import type { HTMLAttributes } from 'vue';
import type { UnsubscribeFunction } from 'emittery';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const $event_bus = useEventBus();
const event_unsubs = ref<UnsubscribeFunction[]>([]);

const dialog = useTemplateRef<HTMLDialogElement>('dialog');
const entry = ref<Entry>();
const is_open = ref<boolean>(false);

onKeyStroke('Escape', async () => await close(), { dedupe: true });

useMutationObserver(dialog, (changes) => {
  const dialog_ele = changes[0].target as HTMLDialogElement;
  set(is_open, dialog_ele.hasAttribute('open'));
}, {
  attributeFilter: ['open'],
  subtree: false,
});

function open(): void {
  if (get(is_open)) return;
  const dialog_ele = get(dialog);
  if (!dialog_ele) return;
  dialog_ele.showModal();
  document.body.classList.add('overflow-hidden!');
}

async function close(): Promise<void> {
  if (!get(is_open)) return;
  const dialog_ele = get(dialog);
  if (!dialog_ele) return;
  document.body.classList.remove('overflow-hidden!');
  await $event_bus.emit('hide_dialog');
  dialog_ele.close();
}

onMounted(() => {
  get(event_unsubs).push(
    $event_bus.on('show_dialog', (new_entry) => {
      set(entry, new_entry);
      // but first need to replace <slot>s in template with appropriate elements for special entry type provided
      open();
    })
  );
});

onUnmounted(() => {
  for (const unsub of get(event_unsubs)) unsub();
});
</script>

<style>
@reference '../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    @apply fixed left-1/2 top-1/2 -translate-1/2 hidden w-screen h-screen max-w-screen max-h-screen
           m-0 p-0 border-none z-[1000] cursor-pointer;

    &[open] {
      @apply flex flex-row flex-nowrap items-center justify-center;

      &::backdrop {
        @apply bg-black/85 z-[999] max-w-screen max-h-screen w-screen h-screen;
      }
    }

    & .preview-dialog__wrapper {
      @apply flex flex-col flex-nowrap items-center justify-center max-w-screen max-h-screen h-auto w-auto;

      & .preview-dialog__content {
        @apply flex flex-row flex-nowrap items-center justify-center
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

    & .preview-dialog__actions {
      @apply flex flex-row flex-nowrap items-center justify-center
              gap-1 sm:gap-0 absolute right-0 top-0 bg-background
              border-l border-b border-zinc-300 dark:border-zinc-700;

      & svg.icon {
        @apply size-7 sm:size-6;
      }

      & a,
      & button {
        @apply text-muted-foreground;

        @variant hover {
          @apply text-primary;
        }
      }
    }
  }
}
</style>
