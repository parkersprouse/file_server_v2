<template>
  <section
    class='container'
    :class='{
      "px-0! mx-0! w-full! max-w-none!": view === ViewType.LIST,
    }'
  >
    <ViewStack
      v-if='view === ViewType.ROWS'
      mode='row'
      :entries='entries'
      :scroll-to-index='scrollToIndex'
    />
    <ViewGrid
      v-else-if='view === ViewType.GRID'
      :entries='entries'
      :scroll-to-index='scrollToIndex'
    />
    <ViewStack
      v-else
      mode='list'
      :entries='entries'
      :scroll-to-index='scrollToIndex'
    />
  </section>
</template>

<script setup lang='ts'>
import { computed } from 'vue';

import { ViewType } from 'enums/view_type.ts';
import { useRouterStore } from 'stores/router.ts';

import type { Entry } from 'types/entry.d.ts';

const { entries, scrollToIndex = -1 } = defineProps<{
  entries: Entry[];
  // Entry index to scroll into view (a direct-linked entry, negative for
  //   none); see ViewStack/ViewGrid.
  scrollToIndex?: number;
}>();

const $store = useRouterStore();

const view = computed<ViewType>(() => $store.view);
</script>
