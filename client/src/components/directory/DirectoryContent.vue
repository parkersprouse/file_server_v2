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

import type { EntryDetails } from 'types/entry_details.d.ts';

const { entries } = defineProps<{
  entries: EntryDetails[];
}>();

const $store = useStore();
</script>
