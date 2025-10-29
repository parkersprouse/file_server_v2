<template>
  <NavBar />

  <main
    :style='{
      height: `calc(100vh - ${toolbar_height})`,
      minHeight: `calc(100vh - ${toolbar_height})`,
      maxHeight: `calc(100vh - ${toolbar_height})`,
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
import { http } from 'lib/http.ts';
import { pathToRoute, toFileUrl } from 'lib/utils.ts';
import { useStore } from 'stores/global.ts';

import type { UnsubscribeFunction } from 'emittery';
import type { Entry } from 'types/entry.d.ts';

const event_unsubs = ref<UnsubscribeFunction[]>([]);
const $event_bus = useEventBus();
const $route = useRoute();
const $store = useStore();

const error = ref<boolean>(false);
const entries = ref<Entry[]>();
const entries_abort_cont = ref<AbortController>();

const toolbar_height = computed<string>(() => `${$store.toolbar_height ?? 0}px`);

async function getEntries(): Promise<void> {
  try {
    if (get(entries_abort_cont)) get(entries_abort_cont)!.abort();
    const new_abort_conntroller = new AbortController();
    const timer_id = setTimeout(() => set(entries, undefined), 150);
    const res = await http.get(pathToRoute($route), {
      signal: new_abort_conntroller.signal,
    });
    set(entries_abort_cont, new_abort_conntroller);
    clearTimeout(timer_id);
    const previewable_strings = Object.values(PreviewType).map((p) => p as string);
    set(entries, res.data.map((entry: Entry) => {
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
    }));
    get(entries_abort_cont)?.abort();
    set(entries_abort_cont, undefined);
  } catch {
    set(error, true);
  }
}

onMounted(async () => {
  await getEntries();
  get(event_unsubs).push(
    $event_bus.on('path_updated', getEntries),
    $event_bus.on('query_updated', async (should_refresh: boolean): Promise<void> => {
      if (should_refresh) await getEntries();
    }),
  );
});

onUnmounted(() => {
  for (const unsub of get(event_unsubs)) unsub();
});
</script>

<style scoped>
@reference '../assets/styles/index.css';

main {
  @apply flex flex-col justify-start items-center py-6 px-0 z-0 w-screen overflow-y-auto overflow-x-hidden relative;
}
</style>
