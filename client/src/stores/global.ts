import { get, set, useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, ref } from 'vue';

import type { FileHighlightResult } from 'types/file_highlight_result.d.ts';

export const useStore = defineStore('global', () => {
  /*-- State --*/
  const file_highlight_result = ref<FileHighlightResult>();
  const preview_bg_enabled = useLocalStorage<boolean>('preview_bg_enabled', false);
  const preview_inline_colors_disabled = useLocalStorage('preview_inline_colors_disabled', false);
  const preview_text_wrapped = useLocalStorage('preview_text_wrapped', false);
  const toolbar_height = ref<number>(0);

  /*-- Computed --*/
  const inline_colors_present = computed<boolean>(() => get(file_highlight_result)?.inline_colors_present ?? false);
  const wrap_text_preview = computed<boolean>(() => get(preview_text_wrapped));

  /*-- Methods --*/
  function toggleInlineColorsPreview(): void {
    set(preview_inline_colors_disabled, !get(preview_inline_colors_disabled));
  }

  function togglePreviewLineWrap(): void {
    set(preview_text_wrapped, !get(preview_text_wrapped));
  }

  return {
    /*-- State --*/
    file_highlight_result,
    preview_bg_enabled,
    preview_inline_colors_disabled,
    preview_text_wrapped,
    toolbar_height,

    /*-- Computed --*/
    inline_colors_present,
    wrap_text_preview,

    /*-- Methods --*/
    toggleInlineColorsPreview,
    togglePreviewLineWrap,
  };
});
