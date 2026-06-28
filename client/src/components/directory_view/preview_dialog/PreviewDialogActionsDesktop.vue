<!--
  Desktop preview action bar: the original full, single-row toolbar. Lives in
  its own component so crossing the mobile/desktop breakpoint is a clean
  component swap (see PreviewDialogActions.vue). The template MUST have a single
  root element for that swap to be atomic: a multi-root (fragment) template
  turns the breakpoint cross into a fragment reconciliation, which desyncs the
  insertion anchors of the reka-ui tooltip portals and throws
  "Node.insertBefore: Child to insert before is not a child of this node".
-->

<template>
  <div class='preview-dialog__actions'>
    <template v-if='entry.preview_type === PreviewType.TEXT'>
      <template v-if='source_actions_visible'>
        <PreviewDialogCopyTextAction v-if='clipboard_available' />
        <PreviewDialogToggleLineWrapAction />
        <PreviewDialogToggleInlineColorsAction v-if='$store.inline_colors_present' />
        <Separator
          orientation='vertical'
          class='h-auto! self-stretch!'
        />
      </template>

      <PreviewDialogToggleMarkdownAction v-if='is_markdown' />

      <Separator
        v-if='text_actions_present'
        orientation='vertical'
        class='h-auto! self-stretch!'
      />
    </template>

    <template v-if='entry.preview_type === PreviewType.IMAGE && $store.show_media_tools'>
      <PreviewDialogImageActions />

      <Separator
        orientation='vertical'
        class='h-auto! self-stretch!'
      />
    </template>

    <template v-if='entry.preview_type && [PreviewType.IMAGE, PreviewType.VIDEO].includes(entry.preview_type)'>
      <PreviewDialogTooltip>
        <Button
          variant='ghost'
          :aria-label='`${$store.show_media_tools ? "Hide" : "Show"} Controls`'
          class='ghost-ext h-auto!'
          @click.prevent='() => { $store.show_media_tools = !$store.show_media_tools; }'
        >
          <icon-resize-fill v-if='$store.show_media_tools' />
          <icon-resize v-else />
        </Button>

        <template #content>
          {{ $store.show_media_tools ? 'Hide' : 'Show' }} Controls
        </template>
      </PreviewDialogTooltip>

      <Separator
        orientation='vertical'
        class='h-auto! self-stretch!'
      />
    </template>

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
import { useEventBus } from 'composables/event_bus.ts';
import { usePreviewActions } from 'composables/preview_actions.ts';
import { PreviewType } from 'enums/preview_type.ts';
import { useStore } from 'stores/global.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $event_bus = useEventBus();
const $store = useStore();

const {
  clipboard_available,
  is_markdown,
  source_actions_visible,
  text_actions_present,
} = usePreviewActions(() => entry);
</script>
