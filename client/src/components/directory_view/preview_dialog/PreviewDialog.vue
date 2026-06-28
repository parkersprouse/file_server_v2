<template>
  <dialog
    ref='dialog'
    :aria-label='entry?.name'
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

      <!--
        Gallery navigation: cycle through the images/videos of the current
        directory, in the order they're currently listed. Only shown when the
        open file is itself media and there is more than one to move between.
      -->
      <template v-if='has_media_nav'>
        <button
          type='button'
          class='preview-dialog__nav preview-dialog__nav--prev'
          aria-label='Previous media'
          @click.stop='showPreviousMedia'
        >
          <icon-caret-left aria-hidden='true' />
        </button>

        <button
          type='button'
          class='preview-dialog__nav preview-dialog__nav--next'
          aria-label='Next media'
          @click.stop='showNextMedia'
        >
          <icon-caret-right aria-hidden='true' />
        </button>

        <div
          v-if='$store.show_media_tools'
          aria-live='polite'
          aria-atomic='true'
          class='preview-dialog__counter'
        >
          {{ current_media_index + 1 }} / {{ media_entries.length }}
        </div>
      </template>
    </template>

    <!--
      Dedicated, always-present mount point for teleported overlays (the mobile
      action pill, dropdown menus). Teleports MUST target this isolated node
      rather than `.preview-dialog` directly: the dialog's own children are
      patched dynamically (the `v-if='entry'` block, the `has_media_nav`
      fragment), and mixing Vue-managed siblings with foreign teleported nodes
      in the same container corrupts the patch anchors on re-render/resize
      ("Node.insertBefore: Child to insert before is not a child of this node").
      `display: contents` keeps it out of layout; the dialog's top-layer
      promotion still covers its (fixed-positioned) teleported children.
    -->
    <div class='preview-dialog__overlays' />
  </dialog>
</template>

<script setup lang='ts'>
import { get, onKeyStroke, set, useMutationObserver } from '@vueuse/core';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { PreviewType } from 'enums/preview_type.ts';
import { cn } from 'lib/utils.ts';
import { useStore } from 'stores/global.ts';

import type { UnsubscribeFunction } from 'emittery';
import type { Entry } from 'types/entry.d.ts';
import type { PreviewTypeAttrs } from 'types/preview_type_attrs.d.ts';
import type { PreviewTypeAttrsMapping } from 'types/preview_type_attrs_mapping.d.ts';

// Lazy-load preview components
const AudioPreview = defineAsyncComponent(() =>
  import('components/directory_view/preview_dialog/file_viewers/AudioPreview.vue'));
const DocumentPreview = defineAsyncComponent(() =>
  import('components/directory_view/preview_dialog/file_viewers/DocumentPreview.vue'));
const ImagePreview = defineAsyncComponent(() =>
  import('components/directory_view/preview_dialog/file_viewers/ImagePreview.vue'));
const TextPreview = defineAsyncComponent(() =>
  import('components/directory_view/preview_dialog/file_viewers/TextPreview.vue'));
const VideoPreview = defineAsyncComponent(() =>
  import('components/directory_view/preview_dialog/file_viewers/VideoPreview.vue'));

// The preview types that participate in the prev/next media gallery.
const MEDIA_PREVIEW_TYPES: PreviewType[] = [PreviewType.IMAGE, PreviewType.VIDEO];

const { entries = [] } = defineProps<{
  entries?: Entry[];
}>();

const $event_bus = useEventBus();
const event_unsubs = ref<UnsubscribeFunction[]>([]);
const $store = useStore();

const dialog = useTemplateRef<HTMLDialogElement>('dialog');
const entry = ref<Entry>();
const is_open = ref<boolean>(false);

// The directory's images/videos, in the order they're currently listed.
const media_entries = computed<Entry[]>(() =>
  entries.filter((candidate) =>
    candidate.preview_type !== undefined && MEDIA_PREVIEW_TYPES.includes(candidate.preview_type)));

const current_media_index = computed<number>(() => {
  const current = get(entry);
  if (!current) return -1;
  return get(media_entries).findIndex((candidate) => candidate.path === current.path);
});

// Only offer navigation when the open file is media and there's somewhere to go.
const has_media_nav = computed<boolean>(() =>
  get(current_media_index) !== -1 && get(media_entries).length > 1 && $store.show_media_tools);

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
onKeyStroke('ArrowLeft', (event) => onArrowNav(event, showPreviousMedia), { dedupe: true });
onKeyStroke('ArrowRight', (event) => onArrowNav(event, showNextMedia), { dedupe: true });

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

// Swap the open file to another media entry without re-opening the dialog;
// reassigning `entry` re-renders the matching preview component in place.
function showMediaAt(index: number): void {
  const media = get(media_entries);
  if (media.length === 0) return;
  // Wrap around so the gallery is endless in both directions.
  const target = media[(index + media.length) % media.length];
  if (target) set(entry, target);
}

function showPreviousMedia(): void {
  if (!get(has_media_nav)) return;
  showMediaAt(get(current_media_index) - 1);
}

function showNextMedia(): void {
  if (!get(has_media_nav)) return;
  showMediaAt(get(current_media_index) + 1);
}

function onArrowNav(event: KeyboardEvent, navigate: () => void): void {
  if (!get(is_open) || !get(has_media_nav)) return;
  // Leave the arrow keys to a focused video player so they still seek it.
  if (document.activeElement?.closest('media-controller')) return;
  event.preventDefault();
  navigate();
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
    $event_bus.on('show_dialog', ({ data: new_entry }) => open(new_entry)),
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

    & .preview-dialog__overlays {
      display: contents;
    }

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

    & .preview-dialog__nav {
      @apply fixed top-1/2 -translate-y-1/2 z-1008 flex items-center justify-center
             size-11 sm:size-12 rounded-full border bg-background/80 backdrop-blur-sm
             text-muted-foreground hover:text-primary hover:bg-background transition-colors;

      cursor: pointer;

      &.preview-dialog__nav--prev {
        @apply left-2 sm:left-4;
      }

      &.preview-dialog__nav--next {
        @apply right-2 sm:right-4;
      }

      & svg {
        @apply size-6 sm:size-7 shrink-0;
      }
    }

    & .preview-dialog__counter {
      @apply fixed top-2 left-1/2 -translate-x-1/2 z-1008 px-2.5 py-0.5 rounded-full border
             bg-background/80 backdrop-blur-sm text-muted-foreground text-xs tabular-nums select-none;
    }
  }
}
</style>
