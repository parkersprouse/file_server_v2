<template>
  <!-- <ContextMenu>
    <ContextMenuTrigger class='contents'> -->
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
    <!-- </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem>
        <icon-list-dashes />
        List
      </ContextMenuItem>
      <ContextMenuItem>
        <icon-rows />
        Rows
      </ContextMenuItem>
      <ContextMenuItem>
        <icon-squares-four />
        Grid
      </ContextMenuItem>
      <ContextMenuSeparator />
    </ContextMenuContent>
  </ContextMenu> -->
</template>

<script setup lang='ts'>
import { set, useEventBus } from '@vueuse/core';
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import { useIsMobile } from 'composables/is_mobile.ts';
import { EventBus } from 'enums/event_bus.ts';
import { Events } from 'enums/events.ts';
import { http } from 'lib/http.ts';
import { pathToRoute } from 'lib/utils.ts';
import { useStore } from 'stores/global.ts';

import type { Entry } from 'types/entry.d.ts';

const $entries_bus = useEventBus<Events>(EventBus.Entries);
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
    set(entries, res.data);
  } catch {
    set(error, true);
  }
}

onMounted(async () => {
  await getEntries();
  $entries_bus.on(async (event: Events) => {
    if ([Events.PathUpdated, Events.QueryUpdated].includes(event)) await getEntries();
  });
});
</script>

<style>
@reference '../assets/styles/index.css';

main {
  @apply flex flex-col justify-start items-center min-h-screen px-4 pb-4 z-0
         mx-auto w-full sm:w-xl md:w-2xl lg:w-4xl xl:w-6xl 2xl:w-7xl;
}
</style>
