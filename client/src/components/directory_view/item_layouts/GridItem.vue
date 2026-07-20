<template>
  <Card class='p-0! h-full! gap-2!'>
    <CardContent class='flex flex-row flex-nowrap justify-center items-center p-0! grow shrink h-40 overflow-hidden'>
      <img
        v-if='entry.thumbnail && heic_check'
        :src='entry.thumbnail'
        :alt='entry.name'
        loading='lazy'
        decoding='async'
        class='w-full h-full object-contain aspect-square'
      >
      <component
        v-else
        :is='fileTypeToIcon(entry.file_type || entry.entry_type)'
        aria-hidden='true'
        class='size-1/2 aspect-square'
      />
    </CardContent>
    <CardFooter class='flex flex-col flex-nowrap justify-center items-start p-0! grow-0'>
      <div class='entry-title scrollbar-hidden'>
        {{ entry.name }}
      </div>
      <div
        v-if='$router_store.searching'
        class='w-full truncate text-xs text-muted-foreground'
        :title='entryLocation(entry)'
      >
        {{ entryLocation(entry) }}
      </div>
      <div class='flex flex-row flex-nowrap justify-between items-center w-full'>
        <EntryModifiedBadge :entry='entry' />
        <EntryDurationBadge :entry='entry' />
      </div>
    </CardFooter>
  </Card>
</template>

<script setup lang='ts'>
import { inject } from 'vue';

import { entryLocation, fileTypeToIcon } from 'lib/entry_helpers.ts';
import { useRouterStore } from 'stores/router.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
}>();

const $router_store = useRouterStore();
const heic_check = inject<boolean>('heic_check', false);
</script>
