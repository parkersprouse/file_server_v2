import { get, set, useLocalStorage } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed } from 'vue';

import { isDir } from 'lib/entry_helpers.ts';

import type { Bookmark } from 'types/bookmark.d.ts';
import type { Entry } from 'types/entry.d.ts';

/**
 * Bookmarked folders / files, kept in local storage (so per browser, like the
 * other preferences) and keyed by path. A bookmark only remembers where the
 * entry was: opening one behaves like a "Copy Link" URL, including the
 * dead-link handling when the entry has since moved.
 */
export const useBookmarksStore = defineStore('bookmarks', () => {
  const stored = useLocalStorage<Bookmark[]>('bookmarks', []);

  // Storage is user-editable and shared across tabs / app versions, so only
  // well-formed records are ever handed to the UI.
  const bookmarks = computed<Bookmark[]>(() => {
    const value: unknown = get(stored);
    if (!Array.isArray(value)) return [];
    return value.filter((item: Partial<Bookmark> | null): item is Bookmark =>
      typeof item?.path === 'string' && typeof item.name === 'string');
  });

  function has(path: string): boolean {
    return get(bookmarks).some((bookmark) => bookmark.path === path);
  }

  function add(bookmark: Omit<Bookmark, 'added_at'>): void {
    if (has(bookmark.path)) return;
    set(stored, [...get(bookmarks), {
      ...bookmark,
      added_at: Date.now(),
    }]);
  }

  function remove(path: string): void {
    set(stored, get(bookmarks).filter((bookmark) => bookmark.path !== path));
  }

  function fromEntry(entry: Entry): Omit<Bookmark, 'added_at'> {
    return {
      file_type: isDir(entry) ? undefined : entry.file_type,
      name: entry.name,
      path: entry.path,
    };
  }

  return {
    bookmarks,

    add,
    fromEntry,
    has,
    remove,
  };
});
