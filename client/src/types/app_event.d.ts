import type { Entry } from 'types/entry.d.ts';

export type AppEvent = {
  copy_text: undefined;
  dialog_clicked: Event;
  hide_dialog: undefined;
  path_updated: undefined;
  query_updated: undefined;
  resize_preview_actions: DOMRect;
  show_dialog: Entry;
  text_copied: undefined;
  toggle_dialog_content_bg: undefined;
};
