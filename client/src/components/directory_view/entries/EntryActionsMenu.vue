<template>
  <DropdownMenu :modal='false'>
    <DropdownMenuTrigger as-child>
      <Button
        variant='outline'
        size='icon'
        class='entry-actions'
        :aria-label='`Actions for ${entry.name}`'
      >
        <icon-ellipsis-vertical aria-hidden='true' />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align='center'>
      <DropdownMenuItem @select='() => $copy()'>
        <icon-link />
        Copy Link
      </DropdownMenuItem>
      <!-- `click`, not `select`: a toggle must run exactly once per activation. -->
      <DropdownMenuItem @click='toggleBookmark'>
        <icon-bookmark-minus v-if='bookmarked' />
        <icon-bookmark-plus v-else />
        {{ bookmarked ? 'Remove Bookmark' : 'Add Bookmark' }}
      </DropdownMenuItem>
      <DropdownMenuItem
        as='a'
        :href='new_tab_href'
        target='_blank'
      >
        <icon-square-arrow-out-up-right />
        Open in New Tab
      </DropdownMenuItem>
      <DropdownMenuItem
        v-if='!isDir(entry)'
        as='a'
        :href='`${entry.url}?download`'
        download
      >
        <icon-download />
        Download
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang='ts'>
import { computed } from 'vue';
import { toast } from 'vue-sonner';

import { useCopyLink } from 'composables/copy_link.ts';
import { buildEntryLink, isDir } from 'lib/entry_helpers.ts';
import { useBookmarksStore } from 'stores/bookmarks.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $copy = useCopyLink(entry);
const $bookmarks = useBookmarksStore();

const bookmarked = computed<boolean>(() => $bookmarks.has(entry.path));

function toggleBookmark(): void {
  if (bookmarked.value) {
    $bookmarks.remove(entry.path);
    toast.success('Bookmark removed', { id: 'bookmark-toggled' });
  } else {
    $bookmarks.add($bookmarks.fromEntry(entry));
    toast.success('Bookmark added', { id: 'bookmark-toggled' });
  }
}

const new_tab_href = computed<string>(() => isDir(entry) ? buildEntryLink(entry) : `${entry.url}?inline`);
</script>

<style>
@reference '../../../assets/styles/index.css';

/*
 * Anchored to the top-right of the entry's `.entry-cell`: a ghost-style square flush with
 * the corner and rounded only on its bottom-left (Grid / Row). List view
 * overrides the placement in ListItem.vue. With hover available the button
 * appears on hover / focus / while open; otherwise it's always shown.
 */
.entry-actions {
  @apply absolute top-px right-px z-10 size-8 rounded-bl-sm pointer-coarse:size-10
         hover:bg-foreground hover:text-background
         data-[state=open]:bg-foreground data-[state=open]:text-background;

  & svg {
    @apply size-4;
  }
}

@media (hover: hover) {
  .entry-actions:not([data-state='open']) {
    @apply opacity-0;
  }

  .entry-cell:hover .entry-actions,
  .entry-cell:focus-within .entry-actions {
    @apply opacity-100;
  }
}
</style>
