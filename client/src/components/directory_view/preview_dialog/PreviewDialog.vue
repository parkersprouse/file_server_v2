<template>
  <dialog
    ref='dialog'
    :class='cn(
      "preview-dialog",
      `${$store.preview_bg_enabled && "preview-dialog--opaque-bg" || ""}`,
      preview_type?.class,
    )'
    @click='async (event) => await onClickDialog(event)'
  >
    <template v-if='entry'>
      <div class='preview-dialog__header'>
        <PreviewDialogActions :entry='entry' />
      </div>

      <PreviewDialogTitle :entry='entry' />

      <PreviewDialogContent>
        <component
          :is='preview_type?.type'
          :entry='entry'
        />
      </PreviewDialogContent>
    </template>
  </dialog>
</template>

<script setup lang='ts'>
import { get, onKeyStroke, set, useMutationObserver } from '@vueuse/core';
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

import AudioPreview from 'components/directory_view/preview_dialog/file_viewers/AudioPreview.vue';
import DocumentPreview from 'components/directory_view/preview_dialog/file_viewers/DocumentPreview.vue';
import ImagePreview from 'components/directory_view/preview_dialog/file_viewers/ImagePreview.vue';
import TextPreview from 'components/directory_view/preview_dialog/file_viewers/TextPreview.vue';
import VideoPreview from 'components/directory_view/preview_dialog/file_viewers/VideoPreview.vue';
import { useEventBus } from 'composables/event_bus.ts';
import { PreviewType } from 'enums/preview_type.ts';
import { cn } from 'lib/utils.ts';
import { useStore } from 'stores/global.ts';

import type { UnsubscribeFunction } from 'emittery';
import type { Entry } from 'types/entry.d.ts';
import type { PreviewTypeAttrs } from 'types/preview_type_attrs.d.ts';
import type { PreviewTypeAttrsMapping } from 'types/preview_type_attrs_mapping.d.ts';

const $event_bus = useEventBus();
const event_unsubs = ref<UnsubscribeFunction[]>([]);
const $store = useStore();

const dialog = useTemplateRef<HTMLDialogElement>('dialog');
const entry = ref<Entry>();
const is_open = ref<boolean>(false);

const preview_type = computed<PreviewTypeAttrs | undefined>(() => {
  const file_entry = get(entry);
  if (!file_entry?.preview_type) return;
  const mapping: PreviewTypeAttrsMapping = {
    [PreviewType.AUDIO]: {
      class: 'preview-dialog--audio',
      type: AudioPreview,
    },
    [PreviewType.DOCUMENT]: {
      class: 'preview-dialog--doc',
      type: DocumentPreview,
    },
    [PreviewType.IMAGE]: {
      class: [
        'preview-dialog--image',
        file_entry.name.endsWith('.svg') ? 'preview-dialog--svg' : '',
      ].join(' ').trim(),
      type: ImagePreview,
    },
    [PreviewType.SPREADSHEET]: {
      class: 'preview-dialog--doc',
      type: DocumentPreview,
    },
    [PreviewType.TEXT]: {
      class: 'preview-dialog--text',
      type: TextPreview,
    },
    [PreviewType.VIDEO]: {
      class: 'preview-dialog--video',
      type: VideoPreview,
    },
  };
  return mapping[file_entry.preview_type];
});

onKeyStroke('Escape', async () => await close(), { dedupe: true });

useMutationObserver(dialog, (changes) => {
  const change = changes[0];
  if (!change) return;
  const dialog_ele = change.target as HTMLDialogElement;
  set(is_open, dialog_ele.hasAttribute('open'));
}, {
  attributeFilter: ['open'],
  subtree: false,
});

function open(new_entry: Entry): void {
  if (get(is_open)) return;
  const dialog_ele = get(dialog);
  if (!dialog_ele) return;
  document.body.classList.add('overflow-hidden!');
  set(entry, new_entry);
  dialog_ele.showModal();
}

async function close(): Promise<void> {
  if (!get(is_open)) return;
  const dialog_ele = get(dialog);
  if (!dialog_ele) return;
  document.body.classList.remove('overflow-hidden!');
  set(entry, undefined);
  dialog_ele.close();
}

async function onClickDialog(event: Event): Promise<void> {
  const target = event.target as HTMLDivElement;
  if (!target) return;
  if ([
    'preview-dialog',
    'preview-dialog__content',
  ].some((klass) => target.classList.contains(klass))) {
    await close();
  }
}

onMounted(() => {
  get(event_unsubs).push(
    $event_bus.on('show_dialog', (new_entry) => open(new_entry)),
    $event_bus.on('hide_dialog', async () => await close()),
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
    @apply fixed left-0 top-0 hidden w-full h-full max-w-full max-h-full
           m-auto p-0 border-none z-1000 bg-transparent;

    cursor: initial;

    &[open] {
      @apply flex flex-col flex-nowrap items-center justify-center;

      &::backdrop {
        @apply z-999 bg-black/85 max-w-full max-h-full w-full h-full;
      }
    }

    &.preview-dialog--opaque-bg::backdrop {
      @apply bg-zinc-500/85 dark:bg-zinc-700/85;
    }

    & .preview-dialog__header {
      @apply fixed left-0 top-0 w-full flex flex-row flex-nowrap items-start justify-end gap-4 z-1010;
      cursor: initial;
    }

    & .preview-dialog__title {
      @apply fixed bottom-0 right-0 flex z-1004 hover:z-1020;
    }

    & .preview-dialog__content {
      @apply z-1005 relative;
    }
  }
}
</style>
