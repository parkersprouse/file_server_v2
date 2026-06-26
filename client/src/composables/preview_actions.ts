import { computed, toValue } from 'vue';

import { PreviewType } from 'enums/preview_type.ts';
import { isMarkdownFile } from 'lib/markdown.ts';
import { useStore } from 'stores/global.ts';

import type { Entry } from 'types/entry.d.ts';
import type { ComputedRef, MaybeRefOrGetter } from 'vue';

export interface PreviewActionsState {
  clipboard_available: ComputedRef<boolean>;
  has_pill_controls: ComputedRef<boolean>;
  is_markdown: ComputedRef<boolean>;
  source_actions_visible: ComputedRef<boolean>;
  text_actions_present: ComputedRef<boolean>;
}

/**
 * Derived state shared by the mobile and desktop preview action bars. Kept in
 * one place so the two bar variants (`PreviewDialogActionsMobile` /
 * `PreviewDialogActionsDesktop`) can't drift apart.
 */
export function usePreviewActions(entry: MaybeRefOrGetter<Entry>): PreviewActionsState {
  const $store = useStore();

  const clipboard_available = computed<boolean>(() => Boolean(navigator.clipboard));

  const is_markdown = computed<boolean>(() => isMarkdownFile(toValue(entry).name));
  const showing_source = computed<boolean>(() =>
    !is_markdown.value || !$store.preview_markdown_rendered);
  const source_actions_visible = computed<boolean>(() =>
    showing_source.value && Boolean($store.file_highlight_result));
  const text_actions_present = computed<boolean>(() =>
    is_markdown.value || source_actions_visible.value);

  // Whether the floating pill has anything to show for the current file type.
  const has_pill_controls = computed<boolean>(() => {
    const type = toValue(entry).preview_type;
    if (type === PreviewType.IMAGE) return true;
    if (type === PreviewType.TEXT) return is_markdown.value || source_actions_visible.value;
    return false;
  });

  return {
    clipboard_available,
    has_pill_controls,
    is_markdown,
    source_actions_visible,
    text_actions_present,
  };
}
