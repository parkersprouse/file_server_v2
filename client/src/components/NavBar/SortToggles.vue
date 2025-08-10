<template>
  <section class='flex flex-row flex-nowrap justify-center items-center gap-2 w-full'>
    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.active_dir === SortDir.ASC }'
      @click='$store.setDir(SortDir.ASC)'
    >
      <icon-sort-ascending class='size-12!' />
    </Button>
    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.active_dir === SortDir.DESC }'
      @click='$store.setDir(SortDir.DESC)'
    >
      <icon-sort-descending class='size-12!' />
    </Button>
  </section>

  <!-- <hr class='w-1/2! p-0! my-1! border-zinc-500 border-dashed'> -->

  <section class='flex flex-row flex-nowrap justify-center items-center gap-2 w-full'>
    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.active_key === SortKey.NAME }'
      @click='$store.setKey(SortKey.NAME)'
    >
      <icon-tag class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.active_key === SortKey.DURATION }'
      @click='$store.setKey(SortKey.DURATION)'
    >
      <icon-timer class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.active_key === SortKey.MODIFIED }'
      @click='$store.setKey(SortKey.MODIFIED)'
    >
      <icon-clock-counter-clockwise class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.active_key === SortKey.CREATED }'
      @click='$store.setKey(SortKey.CREATED)'
    >
      <icon-file-plus class='size-12!' />
    </Button>
  </section>
</template>

<script setup lang='ts'>
import { useStore } from '@/stores/global.ts';
import { SortDir } from 'types/sort_dir.ts';
import { SortKey } from 'types/sort_key.ts';

const $store = useStore();
</script>
