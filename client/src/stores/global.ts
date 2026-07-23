import { get, set, useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import type { FileHighlightResult } from 'types/file_highlight_result.d.ts';

// Cap on the number of remembered per-path scroll offsets, to bound growth over
// long browsing sessions.
const MAX_SCROLL_OFFSETS = 50;

export const useStore = defineStore('global', () => {
  /*-- State --*/
  const file_highlight_result = ref<FileHighlightResult>();
  // Name of a direct-linked entry that failed to resolve; store state (rather
  // than route state) so the banner survives the redirect back to the root.
  const linked_entry_error = ref<string | undefined>();
  const preview_bg_enabled = useLocalStorage<boolean>('preview_bg_enabled', false);
  const preview_inline_colors_disabled = useLocalStorage<boolean>('preview_inline_colors_disabled', false);
  const preview_markdown_rendered = useLocalStorage<boolean>('preview_markdown_rendered', true);
  // Whether the preview `<dialog>` is currently showing modally. Store state
  // rather than PreviewDialog-local state because `App.vue` needs it too: a
  // modal dialog makes everything outside its subtree inert, so the toaster has
  // to teleport *into* the dialog while it's open. Written only by
  // PreviewDialog's `open` attribute observer, so it tracks every close path
  // (Esc, backdrop click, the close button) and not just the ones we initiate.
  const preview_open = ref<boolean>(false);
  const preview_text_wrapped = useLocalStorage<boolean>('preview_text_wrapped', false);
  const scroll_offset = ref<{ [key: string]: number; }>({});
  const show_media_tools = useLocalStorage<boolean>('show_media_tooling', true);
  const toolbar_height = ref<number>(0);

  /*-- Computed --*/
  const inline_colors_present = computed<boolean>(() =>
    get<FileHighlightResult | undefined>(file_highlight_result)?.inline_colors_present ?? false);
  const wrap_text_preview = computed<boolean>(() => get<boolean>(preview_text_wrapped));

  /*-- Methods --*/
  function toggleInlineColorsPreview(): void {
    set(preview_inline_colors_disabled, !get<boolean>(preview_inline_colors_disabled));
  }

  function toggleMarkdownRendered(): void {
    set(preview_markdown_rendered, !get<boolean>(preview_markdown_rendered));
  }

  function togglePreviewLineWrap(): void {
    set(preview_text_wrapped, !get<boolean>(preview_text_wrapped));
  }

  function clearLinkedEntryError(): void {
    set(linked_entry_error, undefined);
  }

  function setLinkedEntryError(name: string): void {
    set(linked_entry_error, name);
  }

  function getScrollOffset(path: string): number | undefined {
    return get(scroll_offset)[path];
  }

  function rememberScrollOffset(path: string, offset: number): void {
    const offsets = get(scroll_offset);
    // Re-insert so the most-recently-used keys sort last in insertion order.
    if (path in offsets) delete offsets[path];
    offsets[path] = offset;
    // Bound the map: evict the oldest entries once past the cap.
    const overflow = Object.keys(offsets).length - MAX_SCROLL_OFFSETS;
    if (overflow > 0) {
      for (const key of Object.keys(offsets).slice(0, overflow)) {
        delete offsets[key];
      }
    }
  }

  return {
    /*-- State --*/
    file_highlight_result,
    linked_entry_error,
    preview_bg_enabled,
    preview_inline_colors_disabled,
    preview_markdown_rendered,
    preview_open,
    preview_text_wrapped,
    show_media_tools,
    toolbar_height,

    /*-- Computed --*/
    inline_colors_present,
    wrap_text_preview,

    /*-- Methods --*/
    clearLinkedEntryError,
    getScrollOffset,
    rememberScrollOffset,
    setLinkedEntryError,
    toggleInlineColorsPreview,
    toggleMarkdownRendered,
    togglePreviewLineWrap,
  };
});
