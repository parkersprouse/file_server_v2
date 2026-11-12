import type { QueryParamValue } from 'stores/router.ts';
import type { Entry } from 'types/entry.d.ts';
import type { PathUpdate } from 'types/path_update.d.ts';

export type AppEvent = {
  copy_text: undefined;
  dialog_clicked: Event;
  hide_dialog: undefined;
  // An in-app direct link was opened without the path changing; `refetch`
  // when the listing on screen isn't the directory's plain one (a search).
  linked_updated: { refetch: boolean; };
  path_updated: PathUpdate;
  path_updating: PathUpdate;
  query_updated: QueryParamValue[];
  resize_preview_actions: DOMRect;
  search_updated: undefined;
  show_dialog: Entry;
  text_copied: boolean;
  toggle_dialog_content_bg: undefined;
  toggle_inline_colors: undefined;
};
