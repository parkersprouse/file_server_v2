<template>
  <div
    class='transition-cover'
    :class='{
      active: transitioning,
    }'
  />

  <NavBar />

  <main
    :style='{
      height: `calc(100% - ${toolbar_height})`,
      minHeight: `calc(100% - ${toolbar_height})`,
      maxHeight: `calc(100% - ${toolbar_height})`,
      top: toolbar_height,
    }'
  >
    <!--
    A work in progress
    <BackButton
      class='fixed'
      :style='{
        left: 0,
        top: toolbar_height,
      }'
    />
    -->
    <DirectoryError v-if='error' />
    <DirectoryLoading v-else-if='!entries' />
    <DirectoryEmpty v-else-if='Boolean(entries) && entries.length === 0' />
    <DirectoryContent
      v-else
      :entries='entries'
    />
  </main>

  <PreviewDialog />
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useEventBus } from 'composables/event_bus.ts';
import { FileType } from 'enums/file_type.ts';
import { PreviewType } from 'enums/preview_type.ts';
import { SortDir } from 'enums/sort_dir.ts';
import { SortKey } from 'enums/sort_key.ts';
import { http } from 'lib/http.ts';
import { sortEntries } from 'lib/sort.ts';
import { pathToRoute, toFileUrl } from 'lib/utils.ts';
import { useStore } from 'stores/global.ts';
import { useRouterStore } from 'stores/router.ts';

import type { UnsubscribeFunction } from 'emittery';
import type { QueryParamValue } from 'stores/router.ts';
import type { Entry } from 'types/entry.d.ts';
import type { RouteLocationNormalizedGeneric } from 'vue-router';

const event_unsubs = ref<UnsubscribeFunction[]>([]);
const $event_bus = useEventBus();
const $route = useRoute();
const $router_store = useRouterStore();
const $store = useStore();

const error = ref<boolean>(false);
const entries = ref<Entry[]>();
const entries_abort_ctrl = ref<AbortController>();
const transitioning = ref<boolean>(false);

const toolbar_height = computed<string>(() => `${$store.toolbar_height ?? 0}px`);

async function getEntries(): Promise<void> {
  try {
    get(entries_abort_ctrl)?.abort();
    const abort_controller = new AbortController();

    const timer_id = setTimeout(() => set(entries, undefined), 150);
    const res = await http.get(pathToRoute($route), {
      signal: abort_controller.signal,
    });
    set(entries_abort_ctrl, abort_controller);
    clearTimeout(timer_id);

    const previewable_strings = Object.values(PreviewType).map((p) => p as string);

    const results = res.data.map((entry: Entry) => {
      entry.url = toFileUrl(entry);

      if (entry.thumbnail) {
        entry.thumbnail = toFileUrl(entry.thumbnail) || null;
      } else if (entry.file_type === FileType.IMAGE) {
        entry.thumbnail = entry.url;
      }

      if (previewable_strings.includes(entry.file_type as string)) {
        entry.preview_type = entry.file_type as string as PreviewType;
      }

      return entry;
    });

    set(entries, sortEntries(results, $router_store.key, $router_store.dir));
  } catch {
    set(error, true);
  }
}

function onBeforeRouteUpdate(_to: RouteLocationNormalizedGeneric, _from: RouteLocationNormalizedGeneric): void {
  set(transitioning, true);
}

function onAfterRouteUpdate(_to: RouteLocationNormalizedGeneric, _from: RouteLocationNormalizedGeneric): void {
  set(transitioning, false);
  // new Promise((resolve) => setTimeout(() => {
  //   set(transitioning, false);
  //   resolve(null);
  // }, 1500));
}

onMounted(async () => {
  $router_store.addBeforeCallback(onBeforeRouteUpdate);
  $router_store.addAfterCallback(onAfterRouteUpdate);

  const sort_param_keys = [...Object.keys(SortKey), ...Object.keys(SortDir)];

  await getEntries();
  get(event_unsubs).push(
    $event_bus.on('path_updated', async () => await getEntries()),
    $event_bus.on('query_updated', (params: QueryParamValue[]): void => {
      const current_entries = get(entries);
      if (current_entries && params.some((param) => sort_param_keys.includes(param.toUpperCase()))) {
        set(entries, sortEntries(current_entries, $router_store.key, $router_store.dir));
      }
    }),
  );
});

onUnmounted(() => {
  $router_store.removeBeforeCallback(onBeforeRouteUpdate);
  $router_store.removeAfterCallback(onAfterRouteUpdate);
  for (const unsub of get(event_unsubs)) unsub();
});
</script>

<style scoped>
@reference '../assets/styles/index.css';

main {
  @apply flex flex-col justify-start items-center py-6 px-0 z-0 w-full overflow-y-auto overflow-x-hidden relative;
}

.transition-cover {
  @apply hidden top-0 bottom-0 left-0 right-0 w-full h-full bg-background/75 z-10000;

  &.active {
    @apply fixed block;
  }
}
</style>
