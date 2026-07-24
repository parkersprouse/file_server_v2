<template>
  <NavBar />

  <main
    id='main-content'
    ref='main_content_wrapper'
    :style='{
      height: `calc(100% - ${toolbar_height})`,
      minHeight: `calc(100% - ${toolbar_height})`,
      maxHeight: `calc(100% - ${toolbar_height})`,
      top: toolbar_height,
    }'
  >
    <LinkedEntryBanner
      v-if='$store.linked_entry_error'
      :name='$store.linked_entry_error'
    />
    <SearchBanner
      v-if='$router_store.searching && !error'
      :count='entries?.length'
    />
    <DirectoryError v-if='error' />
    <DirectoryLoading v-else-if='!entries' />
    <DirectoryEmpty v-else-if='entries.length === 0' />
    <template v-else>
      <div
        class='transition-cover'
        :class='{
          active: transitioning,
        }'
      />
      <DirectoryContent
        :entries='entries'
        :scroll-to-index='linked_index'
      />
    </template>
  </main>

  <PreviewDialog :entries='entries' />
</template>

<script setup lang='ts'>
import { get, set, useTitle } from '@vueuse/core';
import { isAxiosError } from 'axios';
import { computed, onMounted, onUnmounted, provide, ref, useTemplateRef } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useEventBus } from 'composables/event_bus.ts';
import { FileType } from 'enums/file_type.ts';
import { PreviewType } from 'enums/preview_type.ts';
import { SortDir } from 'enums/sort_dir.ts';
import { SortKey } from 'enums/sort_key.ts';
import { canPreview, isFile } from 'lib/entry_helpers.ts';
import { http } from 'lib/http.ts';
import { directory_cache } from 'lib/request_cache.ts';
import { sortEntries } from 'lib/sort.ts';
import { pathToRoute, toFileUrl } from 'lib/utils.ts';
import { useStore } from 'stores/global.ts';
import { useRouterStore } from 'stores/router.ts';

import type { UnsubscribeFunction } from 'emittery';
import type { Entry } from 'types/entry.d.ts';
import type { RouteLocationNormalizedGeneric } from 'vue-router';

const event_unsubs = ref<UnsubscribeFunction[]>([]);
const $event_bus = useEventBus();
const $route = useRoute();
const $router = useRouter();
const $router_store = useRouterStore();
const $store = useStore();

let entries_abort_controller = new AbortController();

const main_content_wrapper = useTemplateRef('main_content_wrapper');

provide('scroll_element', main_content_wrapper);

const error = ref<boolean>(false);
const entries = ref<Entry[]>();
const transitioning = ref<boolean>(false);

// The `linked` value we've already auto-previewed, so refetches can't re-open
// a preview dialog the user has closed.
const auto_previewed = ref<string>();

const toolbar_height = computed<string>(() => `${$store.toolbar_height ?? 0}px`);

// Index of the direct-linked entry in the (sorted) listing, or -1. Inert
// during a search so a same-named search result can't be mistaken for it.
const linked_index = computed<number>(() => {
  if (!$router_store.linked || $router_store.searching) return -1;
  return (get(entries) ?? []).findIndex((entry) => entry.name === $router_store.linked);
});

const page_title = computed<string>(() => {
  const { breadcrumbs } = $router_store;
  const last_index = breadcrumbs.length - 1;
  const last_entry = breadcrumbs[last_index];
  if (!last_entry) return 'File Browser';
  const current_dir = decodeURI(last_entry.label);
  if (breadcrumbs.length <= 1) return `${current_dir}`;
  const dirpath = breadcrumbs.slice(0, last_index);
  return `${current_dir} • [home]/${decodeURI(dirpath.map((path) => path.label).join('/'))}/`;
});
useTitle(page_title);

async function getEntries(): Promise<void> {
  const path = pathToRoute($route);
  // A previous failure shouldn't leave the error view up once a later fetch
  // succeeds (it takes template precedence over the entries).
  set(error, false);
  // Delay the loading state so cache hits and fast responses never flash it.
  const timer_id = setTimeout(() => set(entries, undefined), 150);

  try {
    // The cache resolves this to fresh cached data, an in-flight request for
    // the same path, or a new (deduplicated) request. Failures aren't cached.
    const data = await directory_cache.fetch(path, async () => {
      const res = await http.get(path, { signal: entries_abort_controller.signal });
      return res.data;
    });

    processEntries(data as Entry[]);
    await handleLinkedEntry();
  } catch (err) {
    if (entries_abort_controller.signal.aborted) return;
    // A dead direct link (its parent directory is gone) redirects home with a
    // banner; any other failure keeps the normal error state.
    const linked = $router_store.linked;
    if (linked && isAxiosError(err) && err.response?.status === 404) {
      await redirectLinkedNotFound(linked);
      return;
    }
    set(error, true);
  } finally {
    clearTimeout(timer_id);
  }
}

function processEntries(data: Entry[]): void {
  const previewable_strings = Object.values(PreviewType).map((p) => p as string);

  const results = data.map((entry: Entry) => {
    entry.url = toFileUrl(entry);

    if (entry.file_type === FileType.IMAGE) {
      entry.thumbnail = entry.url;
    } else if (entry.thumbnail) {
      entry.thumbnail = toFileUrl(entry.thumbnail) || null;
    }

    if (previewable_strings.includes(entry.file_type as string)) {
      entry.preview_type = entry.file_type as string as PreviewType;
    }

    return entry;
  });

  set(entries, sortEntries(results, $router_store.key, $router_store.dir));
}

/**
 * Resolve an active direct link against the loaded listing: auto-open the
 * preview when it points at a previewable file, or redirect home with a
 * banner when it points at nothing. Scroll/highlight are handled reactively
 * off `linked_index` / the `linked` param.
 */
async function handleLinkedEntry(): Promise<void> {
  const linked = $router_store.linked;
  if (!linked || $router_store.searching) return;

  const target = get(entries)?.find((entry) => entry.name === linked);
  if (!target) {
    await redirectLinkedNotFound(linked);
    return;
  }

  if (get(auto_previewed) === linked) return;
  set(auto_previewed, linked);
  // Non-previewable and external-URL files get scroll + highlight only; never
  // auto-download or auto-open an external site.
  if (isFile(target) && !target.external_url && canPreview(target)) {
    await $event_bus.emit('show_dialog', target);
  }
}

async function redirectLinkedNotFound(name: string): Promise<void> {
  await $router.replace({
    path: '/',
    query: {},
  });
  // Set after the redirect so `handleBeforeNavigate` doesn't clear it mid-flight.
  $store.setLinkedEntryError(name);
  // When the dead link pointed at the root itself the path doesn't change, so
  // no `path_updated` fires to reset the transition cover — do it explicitly.
  set(transitioning, false);
}

function handleBeforeNavigate(to: RouteLocationNormalizedGeneric, from: RouteLocationNormalizedGeneric): void {
  const content = get(main_content_wrapper);
  if (content) $store.rememberScrollOffset($route.path, content.scrollTop);

  // Leaving the directory dismisses the dead-link banner.
  if (to.path !== from.path) $store.clearLinkedEntryError();

  set(transitioning, true);
}

async function setScrollPosition(): Promise<void> {
  // The direct-linked entry owns the scroll position while active.
  if ($router_store.linked) return;
  // Use requestAnimationFrame for more reliable scroll restoration
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const content = get(main_content_wrapper);
  if (!content) return;
  const offset = $store.getScrollOffset($route.path);
  if (!offset || content.scrollTop === offset) return;
  content.scrollTop = offset ?? 0;
}

onMounted(async () => {
  $router_store.addBeforeCallback(handleBeforeNavigate);

  const sort_param_keys = [...Object.keys(SortKey), ...Object.keys(SortDir)];

  // Subscribe before the initial fetch: a dead direct link redirects to the
  // root from within `getEntries`, and the resulting `path_updated` must be
  // heard for the root listing to load.
  get(event_unsubs).push(
    $event_bus.on('path_updating', ({ data: { to } }) => {
      if ($route.path !== to?.path && !entries_abort_controller.signal.aborted) {
        entries_abort_controller.abort();
      }

      if (entries_abort_controller.signal.aborted) {
        entries_abort_controller = new AbortController();
      }
    }),

    $event_bus.on('path_updated', async () => {
      await getEntries();
      await setScrollPosition();
      set(transitioning, false);
    }),

    $event_bus.on('query_updated', ({ data: params }): void => {
      const current_entries = get(entries);
      // Search patches may carry `undefined` values (param removal), so only
      // consider string values when checking for a sort change.
      const sort_changed = params.some((param) =>
        typeof param === 'string' && sort_param_keys.includes(param.toUpperCase()));
      if (current_entries && sort_changed) {
        set(entries, sortEntries(current_entries, $router_store.key, $router_store.dir));
      }
      set(transitioning, false);
    }),

    $event_bus.on('search_updated', async () => {
      await getEntries();
    }),
  );

  await getEntries();
});

onUnmounted(() => {
  $router_store.removeBeforeCallback(handleBeforeNavigate);
  for (const unsub of get(event_unsubs)) unsub();
});
</script>

<style scoped>
@reference '../assets/styles/index.css';

main {
  @apply flex flex-col justify-start items-center py-6 px-0 z-0 w-full overflow-y-auto overflow-x-hidden relative;

  & .transition-cover {
    @apply hidden top-0 bottom-0 left-0 right-0 w-full h-full bg-background/75 z-10000;

    &.active {
      @apply fixed block;
    }
  }
}
</style>
