<template>
  <div class='preview-dialog__actions'>
    <!-- Actions that only apply to the text file preview -->
    <template v-if='entry.preview_type === PreviewType.TEXT'>
      <!-- Source-view-only actions (hidden while a Markdown file is rendered) -->
      <template v-if='source_actions_visible'>
        <PreviewDialogCopyTextAction v-if='clipboard_available' />
        <PreviewDialogToggleLineWrapAction />
        <PreviewDialogToggleInlineColorsAction v-if='$store.inline_colors_present'/>
        <Separator
          orientation='vertical'
          class='h-auto! self-stretch!'
        />
      </template>

      <!-- Source <-> rendered toggle, only for Markdown files -->
      <PreviewDialogToggleMarkdownAction v-if='is_markdown' />

      <Separator
        v-if='text_actions_present'
        orientation='vertical'
        class='h-auto! self-stretch!'
      />
    </template>

    <!-- Actions that apply universally -->
    <PreviewDialogTitleAction
      v-if='$is_mobile'
      :entry='entry'
    />

    <PreviewDialogTooltip>
      <Button
        variant='ghost'
        :aria-label='`${$store.preview_bg_enabled ? "Darken" : "Lighten"} preview background color`'
        class='ghost-ext h-auto!'
        @click.prevent='() => { $store.preview_bg_enabled = !$store.preview_bg_enabled; }'
      >
        <icon-checkerboard-fill v-if='$store.preview_bg_enabled' />
        <icon-checkerboard v-else />
      </Button>

      <template #content>
        {{ $store.preview_bg_enabled ? 'Darken' : 'Lighten' }} Background
      </template>
    </PreviewDialogTooltip>

    <PreviewDialogTooltip>
      <a
        aria-label='Download file'
        :href='`${entry.url}?download`'
        download
        class='ghost-ext h-auto!'
      >
        <icon-download-simple />
      </a>

      <template #content>
        Download
      </template>
    </PreviewDialogTooltip>

    <PreviewDialogTooltip>
      <a
        aria-label='Open in new tab'
        :href='`${entry.url}?inline`'
        target='_blank'
        class='ghost-ext h-auto!'
      >
        <icon-arrow-square-out />
      </a>

      <template #content>
        Open
      </template>
    </PreviewDialogTooltip>

    <Button
      aria-label='Close preview'
      variant='ghost'
      class='ghost-ext h-auto!'
      @click='async () => await $event_bus.emit("hide_dialog")'
    >
      <icon-x />
    </Button>
  </div>
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { useIsMobile } from 'composables/is_mobile.ts';
import { PreviewType } from 'enums/preview_type.ts';
import { isMarkdownFile } from 'lib/markdown.ts';
import { useStore } from 'stores/global.ts';

import type { Entry } from 'types/entry.d.ts';

const props = defineProps<{
  entry: Entry;
}>();

const $event_bus = useEventBus();
const $is_mobile = useIsMobile();
const $store = useStore();

const entry = ref<Entry>(props.entry);

const clipboard_available = computed<boolean>(() => Boolean(navigator?.clipboard));

const is_markdown = computed<boolean>(() => isMarkdownFile(get(entry).name));
// Markdown can be shown rendered; every other text file is always "source".
const showing_source = computed<boolean>(() => !get(is_markdown) || !$store.preview_markdown_rendered);
const source_actions_visible = computed<boolean>(() =>
  get(showing_source) && Boolean($store.file_highlight_result));
const text_actions_present = computed<boolean>(() => get(is_markdown) || get(source_actions_visible));

watch(() => props.entry, (new_value) => {
  set(entry, new_value);
});
</script>

<style>
@reference '../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__header {
      & .preview-dialog__actions {
        @apply grow-0 shrink w-fit flex flex-row flex-nowrap items-center justify-end gap-1 sm:gap-0
               bg-background border-b border-l;

        & svg.icon {
          @apply size-7 sm:size-6;
        }

        & a,
        & button {
          @apply dark:text-muted-foreground dark:hover:text-primary;
        }
      }
    }
  }
}
</style>
