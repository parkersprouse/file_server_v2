<template>
  <ViewRow
    v-if='$store.active_view === ViewType.ROWS'
    :entries='entries'
  />
  <ViewGrid
    v-else-if='$store.active_view === ViewType.GRID'
    :entries='entries'
  />
  <ViewList
    v-else
    :entries='entries'
  />
</template>

<script setup lang='ts'>
import { ViewType } from 'enums/view_type.ts';
import { useStore } from 'stores/global.ts';

import type { Entry } from 'types/entry.d.ts';

const { entries } = defineProps<{
  entries: Entry[];
}>();

const $store = useStore();
</script>
