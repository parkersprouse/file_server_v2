<!--
  The bookmark list, in a sheet that slides in from the left. Opening a
  bookmark behaves like a "Copy Link" URL (`routerStore.openLinked`): a folder
  opens its listing, a file opens its parent with the file as the direct-link
  target.
-->

<template>
  <Sheet v-model:open='open'>
    <SheetTrigger as-child>
      <Button
        variant='ghost'
        :aria-label='current_bookmarked ? "Bookmarks (this folder is bookmarked)" : "Bookmarks"'
        title='Bookmarks'
        class='p-1.5! h-auto self-stretch ghost-ext'
      >
        <!-- Filled while the folder on screen is itself a bookmark. -->
        <component
          :is='current_bookmarked ? IconBookmarkFilled : IconBookmark'
          aria-hidden='true'
          :class='$is_mobile ? "size-7!" : "size-6!"'
        />
      </Button>
    </SheetTrigger>

    <SheetContent side='left' class='bookmarks-sheet'>
      <SheetHeader class='p-4 pb-2'>
        <SheetTitle class='text-lg'>
          Bookmarks
        </SheetTitle>
        <VisuallyHidden>
          <SheetDescription>
            Saved folders and files
          </SheetDescription>
        </VisuallyHidden>
      </SheetHeader>

      <section
        v-if='current_folder'
        class='px-4 pb-3'
      >
        <Button
          variant='outline'
          class='w-full justify-start gap-2.5'
          :aria-pressed='current_bookmarked'
          @click='toggleCurrentFolder'
        >
          <icon-bookmark-minus v-if='current_bookmarked' aria-hidden='true' />
          <icon-bookmark-plus v-else aria-hidden='true' />
          <span class='truncate'>
            {{ current_bookmarked ? 'Remove this folder' : 'Bookmark this folder' }}
          </span>
        </Button>
      </section>

      <Separator />

      <Empty v-if='$bookmarks.bookmarks.length === 0' class='border-0'>
        <EmptyHeader>
          <EmptyMedia variant='icon'>
            <icon-bookmark aria-hidden='true' />
          </EmptyMedia>
          <EmptyTitle>No bookmarks yet</EmptyTitle>
          <EmptyDescription>
            Add one from a folder or file's actions menu.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>

      <!--
        Press and hold a row to pick it up and drag it to a new position
        (composables/hold_reorder.ts); Alt + Up / Down does the same from the
        keyboard.
      -->
      <ul
        v-else
        ref='list'
        class='bookmarks-sheet__list'
        :class='{ "bookmarks-sheet__list--dragging": dragging }'
      >
        <li
          v-for='(bookmark, index) in $bookmarks.bookmarks'
          :key='bookmark.path'
          class='bookmarks-sheet__item'
          :class='{ "bookmarks-sheet__item--dragged": dragging && itemStyle(index)?.zIndex === 1 }'
          :style='itemStyle(index)'
        >
          <button
            type='button'
            class='bookmarks-sheet__link'
            :aria-keyshortcuts='reorderable ? "Alt+ArrowUp Alt+ArrowDown" : undefined'
            @click='openBookmark(bookmark)'
            @keydown.alt.up.prevent='moveWithKeyboard(index, -1, $event)'
            @keydown.alt.down.prevent='moveWithKeyboard(index, 1, $event)'
          >
            <component
              :is='fileTypeToIcon(bookmark.file_type ?? EntryType.DIR)'
              aria-hidden='true'
              class='size-6 shrink-0'
            />
            <span class='min-w-0 flex flex-col'>
              <span class='truncate font-medium'>{{ bookmark.name }}</span>
              <span class='truncate text-xs text-muted-foreground'>{{ entryLocation(bookmark) }}</span>
            </span>
          </button>
          <Button
            variant='ghost'
            size='icon'
            class='ghost-ext shrink-0 px-0! pointer-coarse:size-10'
            :aria-label='`Remove bookmark ${bookmark.name}`'
            title='Remove bookmark'
            @click='$bookmarks.remove(bookmark.path)'
          >
            <icon-x aria-hidden='true' />
          </Button>
        </li>
      </ul>

      <p
        v-if='reorderable'
        class='px-4 py-3 text-xs text-muted-foreground'
      >
        Press and hold a bookmark to reorder.
      </p>

      <VisuallyHidden>
        <span aria-live='polite'>{{ announcement }}</span>
      </VisuallyHidden>
    </SheetContent>
  </Sheet>
</template>

<script setup lang='ts'>
import IconBookmark from '~icons/lucide/bookmark';
import IconBookmarkFilled from '~icons/lucide-extended/bookmark-filled';

import { VisuallyHidden } from 'reka-ui';
import { computed, nextTick, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

import { useHoldReorder } from 'composables/hold_reorder.ts';
import { useIsMobile } from 'composables/is_mobile.ts';
import { EntryType } from 'enums/entry_type.ts';
import { entryLocation, fileTypeToIcon } from 'lib/entry_helpers.ts';
import { trim } from 'lib/utils.ts';
import { useBookmarksStore } from 'stores/bookmarks.ts';
import { useRouterStore } from 'stores/router.ts';

import type { Bookmark } from 'types/bookmark.d.ts';

const $bookmarks = useBookmarksStore();
const $is_mobile = useIsMobile();
const $route = useRoute();
const $router_store = useRouterStore();

const open = ref<boolean>(false);

// The routed directory in the same shape as an entry's `path` (decoded,
// forward slashes, leading slash); undefined at the root, which needs no
// bookmark.
const current_folder = computed<Omit<Bookmark, 'added_at'> | undefined>(() => {
  let decoded = '';
  try {
    decoded = decodeURIComponent($route.path);
  } catch { /* malformed escape: treated as the root */ }
  const parts = trim(decoded).split(/[\\/]+/g).filter((part) => part.length > 0);
  const name = parts.at(-1);
  return name === undefined ?
    undefined :
    {
      name,
      path: `/${parts.join('/')}`,
    };
});

const current_bookmarked = computed<boolean>(() =>
  current_folder.value !== undefined && $bookmarks.has(current_folder.value.path));

function toggleCurrentFolder(): void {
  const folder = current_folder.value;
  if (!folder) return;
  if (current_bookmarked.value) $bookmarks.remove(folder.path);
  else $bookmarks.add(folder);
}

const list = useTemplateRef<HTMLElement>('list');
const announcement = ref<string>('');
const reorderable = computed<boolean>(() => $bookmarks.bookmarks.length > 1);

function move(from: number, to: number): void {
  const name = $bookmarks.bookmarks[from]?.name;
  $bookmarks.move(from, to);
  announcement.value = `${name} moved to position ${to + 1} of ${$bookmarks.bookmarks.length}`;
}

const { dragging, itemStyle } = useHoldReorder(list, {
  // The remove button is a plain button, not a drag handle.
  ignore_selector: '[data-slot="button"]',
  item_selector: '.bookmarks-sheet__item',
  onMove: move,
});

async function moveWithKeyboard(index: number, step: -1 | 1, event: KeyboardEvent): Promise<void> {
  const to = index + step;
  if (to < 0 || to >= $bookmarks.bookmarks.length) return;
  move(index, to);
  // Moving the row in the DOM drops its focus; put it back on the same row.
  await nextTick();
  (event.target as HTMLElement).focus();
}

async function openBookmark(bookmark: Bookmark): Promise<void> {
  open.value = false;
  if (bookmark.file_type === undefined) await $router_store.openLinked(bookmark.path);
  else await $router_store.openLinked(entryLocation(bookmark), bookmark.name);
}
</script>

<style>
@reference '../../assets/styles/index.css';

.bookmarks-sheet {
  /* Keep clear of display cutouts under `viewport-fit=cover` (0 elsewhere). */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);

  & .bookmarks-sheet__list {
    @apply flex flex-col min-h-0 overflow-y-auto overflow-x-hidden select-none;

    /* A long press picks a row up; it mustn't also open the iOS callout. */
    -webkit-touch-callout: none;
  }

  & .bookmarks-sheet__item {
    @apply flex flex-row flex-nowrap items-center gap-1 pr-2 border-b;
  }

  /* Rows only animate while one is being dragged, so the drop itself (the
     transforms clearing as the list reorders) doesn't play backwards. */
  & .bookmarks-sheet__list--dragging {
    @apply cursor-grabbing;

    & .bookmarks-sheet__item:not(.bookmarks-sheet__item--dragged) {
      @apply transition-transform duration-150;
    }

    & .bookmarks-sheet__link {
      @apply cursor-grabbing;
    }
  }

  & .bookmarks-sheet__item--dragged {
    @apply bg-muted border-y shadow-lg;
  }

  & .bookmarks-sheet__link {
    @apply flex flex-row flex-nowrap items-center gap-3 min-w-0 grow px-4 py-3 text-left cursor-pointer;

    @variant hover {
      @apply bg-muted;
    }
  }
}
</style>
