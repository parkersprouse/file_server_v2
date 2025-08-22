import type { Entry } from 'types/entry.d.ts';

export type AppEvent = {
  dialog_clicked: Event;
  hide_dialog: undefined;
  path_updated: undefined;
  query_updated: undefined;
  show_dialog: Entry;
};
