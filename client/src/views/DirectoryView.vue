<template>
  <NavBar />

  <section
    class='w-screen overflow-y-auto overflow-x-hidden relative'
    :style='{
      height: `calc(100vh - ${toolbar_height})`,
      minHeight: `calc(100vh - ${toolbar_height})`,
      maxHeight: `calc(100vh - ${toolbar_height})`,
      top: toolbar_height,
    }'
  >
    <main>
      <DirectoryError v-if='error' />
      <DirectoryLoading v-else-if='!entries' />
      <DirectoryEmpty v-else-if='Boolean(entries) && entries.length === 0' />
      <DirectoryContent
        v-else
        :entries='entries'
      />
    </main>
  </section>
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useEventBus } from 'composables/event_bus.ts';
import { PreviewType } from 'enums/preview_type.ts';
import { toFileUrl } from 'lib/entry_helpers.ts';
import { http } from 'lib/http.ts';
import { pathToRoute } from 'lib/utils.ts';
import { useStore } from 'stores/global.ts';

import type { UnsubscribeFunction } from 'emittery';
import type { Entry } from 'types/entry.d.ts';

const event_unsubs = ref<UnsubscribeFunction[]>([]);
const $event_bus = useEventBus();
const $route = useRoute();
const $store = useStore();

const error = ref<boolean>(false);
const entries = ref<Entry[]>();

const toolbar_height = computed<string>(() => `${$store.toolbar_height ?? 0}px`);

async function getEntries(): Promise<void> {
  try {
    const timer_id = setTimeout(() => set(entries, undefined), 150);
    const res = await http.get(pathToRoute($route));
    clearTimeout(timer_id);
    const previewable_strings = Object.values(PreviewType).map((p) => p as string);
    set(entries, res.data.map((entry: Entry) => {
      entry.url = toFileUrl(entry);
      if (previewable_strings.includes(entry.file_type as string)) {
        entry.preview_type = entry.file_type as string as PreviewType;
      }
      return entry;
    }));
  } catch {
    set(error, true);
  }
}

onMounted(async () => {
  await getEntries();
  get(event_unsubs).push($event_bus.on(['path_updated', 'query_updated'], getEntries));
});

onUnmounted(() => {
  for (const unsub of get(event_unsubs)) unsub();
});
</script>

<style>
@reference '../assets/styles/index.css';

main {
  @apply flex flex-col justify-start items-center min-h-full p-4 z-0
         mx-auto w-full sm:w-xl md:w-2xl lg:w-4xl xl:w-6xl 2xl:w-7xl relative;
}
</style>
