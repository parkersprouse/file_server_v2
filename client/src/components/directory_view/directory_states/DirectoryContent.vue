<template>
  <ViewRow
    v-if='view === ViewType.ROWS'
    :entries='entries'
  />
  <ViewGrid
    v-else-if='view === ViewType.GRID'
    :entries='entries'
  />
  <ViewList
    v-else
    :entries='entries'
  />
</template>

<script setup lang='ts'>
import { computed } from 'vue';

import { ViewType } from 'enums/view_type.ts';
import { useRouterStore } from 'stores/router.ts';

import type { Entry } from 'types/entry.d.ts';

const { entries } = defineProps<{
  entries: Entry[];
}>();

const $store = useRouterStore();

const view = computed<ViewType>(() => $store.view);
</script>
