import type { QueryParamValue } from 'stores/router.ts';
import type { Entry } from 'types/entry.d.ts';

export type AppEvent = {
  copy_text: undefined;
  dialog_clicked: Event;
  hide_dialog: undefined;
  path_updated: undefined;
  query_updated: QueryParamValue[];
  resize_preview_actions: DOMRect;
  show_dialog: Entry;
  text_copied: boolean;
  toggle_dialog_content_bg: undefined;
  toggle_inline_colors: undefined;
};
