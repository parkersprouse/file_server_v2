import { toast } from 'vue-sonner';

import { buildEntryLink } from 'lib/entry_helpers.ts';
import { copyText } from 'lib/utils.ts';

import type { Entry } from 'types/entry.d.ts';

export function useCopyLink(entry: Entry): () => Promise<void> {
  return async () => {
    const copied = await copyText(buildEntryLink(entry));
    // The stable id dedupes: `select` can fire more than once per activation
    // (the ContextMenuItem wrapper forwards reka-ui's `select` emit while reka
    // also dispatches a DOM `select` event), and repeat copies of the same link
    // should update the existing toast rather than stack new ones.
    if (copied) toast.success('Link copied', { id: 'copy-entry-link' });
    else toast.error('Copy failed', { id: 'copy-entry-link' });
  };
}
