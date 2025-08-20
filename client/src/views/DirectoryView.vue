<template>
  <NavBar />

  <main
    :class='$is_mobile ? "scrollbar-hidden" : ""'
    :style='{ paddingTop: `calc(${toolbar_height} + 1rem)` }'
  >
    <DirectoryError v-if='error' />
    <DirectoryLoading v-else-if='!entries' />
    <DirectoryEmpty v-else-if='Boolean(entries) && entries.length === 0' />
    <DirectoryContent
      v-else
      :entries='entries'
    />
  </main>
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useEventBus } from 'composables/event_bus.ts';
import { useIsMobile } from 'composables/is_mobile.ts';
import { toFileUrl } from 'lib/entry_helpers.ts';
import { http } from 'lib/http.ts';
import { pathToRoute } from 'lib/utils.ts';
import { useStore } from 'stores/global.ts';

import type { Entry } from 'types/entry.d.ts';
import type { UnsubscribeFunction } from 'emittery';

const event_unsubs = ref<UnsubscribeFunction[]>([]);
const $event_bus = useEventBus();
const $is_mobile = useIsMobile();
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
    set(entries, res.data.map((entry: Entry) => {
      entry.url = toFileUrl(entry);
      return entry;
    }));
  } catch {
    set(error, true);
  }
}

onMounted(async () => {
  await getEntries();
  get(event_unsubs).push(
    $event_bus.on(['path_updated', 'query_updated'], getEntries)
  );
});

onUnmounted(() => {
  for (const unsub of get(event_unsubs)) unsub();
});
</script>

<style>
@reference '../assets/styles/index.css';

main {
  @apply flex flex-col justify-start items-center min-h-screen px-4 pb-4 z-0
         mx-auto w-full sm:w-xl md:w-2xl lg:w-4xl xl:w-6xl 2xl:w-7xl;
}
</style>
