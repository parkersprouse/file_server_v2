<!--
  Mobile (`$is_mobile`) splits the bar into two thin slivers so the preview content stays maximally visible:
    • Top bar      → just an overflow (⋯) menu of one-shot file/utility actions
                     + Close. Never overflows, regardless of file type.
    • Floating pill → a thumb-reachable bottom-centre toolbar holding the
                     repeatedly-used VIEW controls, kept immediately accessible:
                       - Image → zoom / rotate / reset  (PreviewDialogImageActions)
                       - Text  → copy / wrap·markdown / colour toggles
                     The pill is omitted entirely when a file type has no view
                     controls, so nothing floats over the content needlessly.
-->

<template>
  <div class='preview-dialog__actions'>
    <!-- ===================================================================
         MOBILE  —  minimal top bar + floating control pill
    ==================================================================== -->
    <template v-if='$is_mobile'>
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
          align='end'
          :side-offset='6'
          class='preview-dialog__overflow'
          to='.preview-dialog__overlays'
        >
          <DropdownMenuItem
            :class='{
              "ghost-ext--active!": title_action?.is_open
            }'
            @select='showFileInfo'
          >
            <icon-info />
            File info
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
        </DropdownMenuContent>
      </DropdownMenu>

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
           the content rather than living inside the top header bar. -->
      <Teleport
        v-if='has_pill_controls'
        to='.preview-dialog__overlays'
      >
        <div class='preview-dialog__pill'>
          <!-- Image: full zoom / rotate / reset cluster (reused verbatim) -->
          <PreviewDialogImageActions v-if='entry.preview_type === PreviewType.IMAGE' />

          <!-- Text: the view toggles that are used while reading -->
          <template v-else-if='entry.preview_type === PreviewType.TEXT'>
            <PreviewDialogCopyTextAction v-if='clipboard_available && source_actions_visible' />
            <PreviewDialogToggleMarkdownAction v-if='is_markdown' />
            <PreviewDialogToggleLineWrapAction v-else-if='source_actions_visible' />
            <PreviewDialogToggleInlineColorsAction
              v-if='source_actions_visible && $store.inline_colors_present'
            />
          </template>
        </div>
      </Teleport>
    </template>

    <!-- ===================================================================
         DESKTOP  —  original full bar (unchanged)
    ==================================================================== -->
    <template v-else>
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

      <template v-if='entry.preview_type === PreviewType.IMAGE'>
        <PreviewDialogImageActions />

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
    </template>
  </div>
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { computed, ref, useTemplateRef, watch } from 'vue';

import PreviewDialogTitleAction from 'components/directory_view/preview_dialog/actions/PreviewDialogTitleAction.vue';
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
const title_action = useTemplateRef<InstanceType<typeof PreviewDialogTitleAction>>('title_action');

const clipboard_available = computed<boolean>(() => Boolean(navigator?.clipboard));

const is_markdown = computed<boolean>(() => isMarkdownFile(get(entry).name));
const showing_source = computed<boolean>(() => !get(is_markdown) || !$store.preview_markdown_rendered);
const source_actions_visible = computed<boolean>(() =>
  get(showing_source) && Boolean($store.file_highlight_result));
const text_actions_present = computed<boolean>(() => get(is_markdown) || get(source_actions_visible));

// Whether the floating pill has anything to show for the current file type.
const has_pill_controls = computed<boolean>(() => {
  const type = get(entry).preview_type;
  if (type === PreviewType.IMAGE) return true;
  if (type === PreviewType.TEXT) return get(is_markdown) || get(source_actions_visible);
  return false;
});

function showFileInfo(): void {
  get(title_action)?.toggleInfo?.();
}

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

    /* Floating control pill — thumb-reachable, translucent, minimal footprint */
    & .preview-dialog__pill {
      @apply fixed bottom-4 left-1/2 -translate-x-1/2 z-1015
             flex flex-row flex-nowrap items-center gap-0.5 p-1
             rounded-full border bg-background/85 backdrop-blur-md
             shadow-[0_6px_20px_rgba(0,0,0,0.4)];

      & svg.icon {
        @apply size-6;
      }

      & a,
      & button {
        @apply rounded-full dark:text-muted-foreground dark:hover:text-primary;
      }

      /* The pill's ghost buttons get a rounded, slightly tighter footprint */
      & .ghost-ext {
        @apply rounded-full p-2!;
      }

      /* Keep the separators inside the existing image-actions cluster compact */
      & [data-slot='separator'] {
        @apply mx-0.5 h-6! self-center!;
      }

      & .preview-dialog__zoom-level {
        @apply px-1;
      }
    }
  }

  .preview-dialog__overflow__trigger {
    &[data-slot='dropdown-menu-trigger'] {
      &[data-state='open'] {
        @apply ghost-ext--active!;
      }
    }
  }

  /* Overflow dropdown: labeled rows, comfortable touch targets, above the dialog */
  [data-slot='dropdown-menu-content'].preview-dialog__overflow {
    @apply z-1100 min-w-52;

    & [data-slot='dropdown-menu-item'] {
      @apply gap-3 px-3 py-2.5 text-sm cursor-pointer;

      & svg {
        @apply size-[1.15rem] shrink-0 text-muted-foreground;
      }

      & a {
        @apply flex flex-row items-center gap-3 w-full;
      }
    }
  }
}
</style>
