<template>
  <NavBar />

  <main
    ref='main_content_wrapper'
    :style='{
      height: `calc(100% - ${toolbar_height})`,
      minHeight: `calc(100% - ${toolbar_height})`,
      maxHeight: `calc(100% - ${toolbar_height})`,
      top: toolbar_height,
    }'
  >
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
      <DirectoryContent :entries='entries' />
    </template>
  </main>

  <PreviewDialog :entries='entries' />
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { computed, onMounted, onUnmounted, provide, ref, useTemplateRef } from 'vue';
import { useRoute } from 'vue-router';

import { useEventBus } from 'composables/event_bus.ts';
import { FileType } from 'enums/file_type.ts';
import { PreviewType } from 'enums/preview_type.ts';
import { SortDir } from 'enums/sort_dir.ts';
import { SortKey } from 'enums/sort_key.ts';
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
const $router_store = useRouterStore();
const $store = useStore();

let entries_abort_controller = new AbortController();

const main_content_wrapper = useTemplateRef('main_content_wrapper');

provide('scroll_element', main_content_wrapper);

const error = ref<boolean>(false);
const entries = ref<Entry[]>();
const transitioning = ref<boolean>(false);

const toolbar_height = computed<string>(() => `${$store.toolbar_height ?? 0}px`);

async function getEntries(): Promise<void> {
  try {
    const path = pathToRoute($route);

    // Check if we have a cached result
    const cached_data = directory_cache.get(path);
    if (cached_data) {
      processEntries(cached_data as Entry[]);
      return;
    }

    // Check if there's a pending request for the same path
    const pending = directory_cache.getPending(path);
    if (pending) {
      const cached = await pending;
      processEntries(cached as Entry[]);
      return;
    }

    // Make the request and cache the promise for deduplication
    const timer_id = setTimeout(() => set(entries, undefined), 150);
    const request_promise = http.get(path, { signal: entries_abort_controller.signal });
    directory_cache.setPending(path, request_promise.then((res) => res.data));

    const res = await request_promise;
    clearTimeout(timer_id);

    directory_cache.set(path, res.data);
    processEntries(res.data);
  } catch {
    if (entries_abort_controller.signal.aborted) return;
    set(error, true);
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

function handleBeforeNavigate(_to: RouteLocationNormalizedGeneric, _from: RouteLocationNormalizedGeneric): void {
  const content = get(main_content_wrapper);
  if (content) $store.rememberScrollOffset($route.path, content.scrollTop);

  set(transitioning, true);
}

async function setScrollPosition(): Promise<void> {
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

  await getEntries();

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
      if (current_entries && params.some((param) => sort_param_keys.includes(param.toUpperCase()))) {
        set(entries, sortEntries(current_entries, $router_store.key, $router_store.dir));
      }
      set(transitioning, false);
    }),
  );
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
