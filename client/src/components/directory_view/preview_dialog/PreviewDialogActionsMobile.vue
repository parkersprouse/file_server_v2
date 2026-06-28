<!--
  Mobile preview action bar. Splits into two thin slivers so the preview
  content stays maximally visible:
    • Top bar      → just an overflow (⋯) menu of one-shot file/utility actions
                     + Close. Never overflows, regardless of file type.
    • Floating pill → a thumb-reachable bottom-centre toolbar holding the
                     repeatedly-used VIEW controls, kept immediately accessible:
                       - Image → zoom / rotate / reset  (PreviewDialogImageActions)
                       - Text  → copy / wrap·markdown / colour toggles
                     The pill is omitted entirely when a file type has no view
                     controls, so nothing floats over the content needlessly.

  This whole bar lives in its own component so crossing the mobile/desktop
  breakpoint is a clean component swap (see PreviewDialogActions.vue) rather
  than an in-place fragment patch. The template MUST have a single root element
  for that swap to be atomic: a multi-root (fragment) template turns the
  breakpoint cross into a fragment reconciliation, which desyncs the insertion
  anchors of the reka-ui dropdown portal and the teleported pill and throws
  "Node.insertBefore: Child to insert before is not a child of this node".
-->

<template>
  <div class='preview-dialog__actions'>
    <!-- File-name flyout, opened from the menu's "File info" row -->
    <PreviewDialogTitleAction
      ref='title_action'
      :entry='entry'
    />

    <!-- Top bar: overflow menu of one-shot file actions, then Close -->
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant='ghost'
          aria-label='More actions'
          class='ghost-ext h-auto! preview-dialog__overflow__trigger'
        >
          <icon-dots-three />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align='start'
        :side-offset='0'
        class='preview-dialog__overflow'
        to='.preview-dialog__overlays'
      >
        <!-- Text: the view toggles that are used while reading -->
        <template v-if='entry.preview_type === PreviewType.TEXT && source_actions_visible'>
          <PreviewDialogToggleLineWrapAction />
          <PreviewDialogToggleInlineColorsAction v-if='$store.inline_colors_present' />
        </template>

        <DropdownMenuItem
          v-if='entry.preview_type && [PreviewType.IMAGE, PreviewType.VIDEO].includes(entry.preview_type)'
          @select='() => { $store.show_media_tools = !$store.show_media_tools; }'
        >
          <icon-resize-fill v-if='$store.show_media_tools' />
          <icon-resize v-else />
          {{ $store.show_media_tools ? 'Hide' : 'Show' }} Controls
        </DropdownMenuItem>

        <DropdownMenuItem @select='() => { $store.preview_bg_enabled = !$store.preview_bg_enabled; }'>
          <icon-checkerboard-fill v-if='$store.preview_bg_enabled' />
          <icon-checkerboard v-else />
          {{ $store.preview_bg_enabled ? 'Darken' : 'Lighten' }} background
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem as-child>
          <a
            :href='`${entry.url}?download`'
            download
          >
            <icon-download-simple />
            Download
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem as-child>
          <a
            :href='`${entry.url}?inline`'
            target='_blank'
          >
            <icon-arrow-square-out />
            Open in new tab
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          :class='{
            "ghost-ext--active!": title_action?.is_open
          }'
          @select='showFileInfo'
        >
          <icon-info />
          File info
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>

    <template v-if='entry.preview_type === PreviewType.TEXT'>
      <PreviewDialogCopyTextAction v-if='clipboard_available && source_actions_visible' />
      <PreviewDialogToggleMarkdownAction v-if='is_markdown' />
    </template>

    <Button
      aria-label='Close preview'
      variant='ghost'
      class='ghost-ext h-auto!'
      @click='async () => await $event_bus.emit("hide_dialog")'
    >
      <icon-x />
    </Button>

    <!-- Floating control pill: the in-use VIEW controls, thumb-reachable.
         Teleported to the dialog's isolated overlay host so it floats over
         the content rather than living inside the top header bar.

         The Teleport is ALWAYS mounted and only its contents toggle (via the
         pill's `v-if`). Toggling the `<Teleport>` element itself with `v-if`
         instead — as it did when navigating image → video, where the pill
         appears for images but not videos — mounts/unmounts the teleport while
         the enclosing modal dialog is mid-patch (content swap + root class
         change), which desyncs the block's insertion anchors and throws inside
         Vue's patch ("emitsOptions"/"nextSibling"/"insertBefore" of null),
         freezing the dialog's DOM out of sync with state. -->
    <Teleport to='.preview-dialog__overlays'>
      <div
        v-if='has_pill_controls && $store.show_media_tools'
        class='preview-dialog__pill'
      >
        <!-- Image: full zoom / rotate / reset cluster (reused verbatim) -->
        <PreviewDialogImageActions v-if='entry.preview_type === PreviewType.IMAGE' />
      </div>
    </Teleport>
  </div>
</template>

<script setup lang='ts'>
import { get } from '@vueuse/core';
import { useTemplateRef } from 'vue';

import PreviewDialogTitleAction from 'components/directory_view/preview_dialog/actions/PreviewDialogTitleAction.vue';
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

const title_action = useTemplateRef<InstanceType<typeof PreviewDialogTitleAction>>('title_action');

const {
  clipboard_available,
  is_markdown,
  source_actions_visible,
  has_pill_controls,
} = usePreviewActions(() => entry);

function showFileInfo(): void {
  get(title_action)?.toggleInfo?.();
}
</script>
