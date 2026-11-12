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

      <ul v-else class='bookmarks-sheet__list'>
        <li
          v-for='bookmark in $bookmarks.bookmarks'
          :key='bookmark.path'
          class='bookmarks-sheet__item'
        >
          <button
            type='button'
            class='bookmarks-sheet__link'
            @click='openBookmark(bookmark)'
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
    </SheetContent>
  </Sheet>
</template>

<script setup lang='ts'>
import IconBookmark from '~icons/lucide/bookmark';
import IconBookmarkFilled from '~icons/lucide-extended/bookmark-filled';

import { VisuallyHidden } from 'reka-ui';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

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
    @apply flex flex-col min-h-0 overflow-y-auto overflow-x-hidden;
  }

  & .bookmarks-sheet__item {
    @apply flex flex-row flex-nowrap items-center gap-1 pr-2 border-b;
  }

  & .bookmarks-sheet__link {
    @apply flex flex-row flex-nowrap items-center gap-3 min-w-0 grow px-4 py-3 text-left cursor-pointer;

    @variant hover {
      @apply bg-muted;
    }
  }
}
</style>
