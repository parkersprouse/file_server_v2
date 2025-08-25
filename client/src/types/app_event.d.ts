import type { Entry } from 'types/entry.d.ts';

export type AppEvent = {
  dialog_clicked: Event;
  hide_dialog: undefined;
  path_updated: undefined;
  query_updated: undefined;
  resize_preview_actions: DOMRect;
  show_dialog: Entry;
};
