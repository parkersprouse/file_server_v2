<template>
  <section class='flex flex-row flex-nowrap justify-center items-center gap-2 w-full'>
    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.dir === SortDir.ASC }'
      @click='$store.dir = SortDir.ASC'
    >
      <icon-sort-ascending class='size-12!' />
    </Button>
    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.dir === SortDir.DESC }'
      @click='$store.dir = SortDir.DESC'
    >
      <icon-sort-descending class='size-12!' />
    </Button>
  </section>

  <!-- <hr class='w-1/2! p-0! my-1! border-zinc-500 border-dashed'> -->

  <section class='flex flex-row flex-nowrap justify-center items-center gap-2 w-full'>
    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.key === SortKey.NAME }'
      @click='$store.key = SortKey.NAME'
    >
      <icon-tag class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.key === SortKey.DURATION }'
      @click='$store.key = SortKey.DURATION'
    >
      <icon-timer class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.key === SortKey.MODIFIED }'
      @click='$store.key = SortKey.MODIFIED'
    >
      <icon-clock-counter-clockwise class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.key === SortKey.CREATED }'
      @click='$store.key = SortKey.CREATED'
    >
      <icon-file-plus class='size-12!' />
    </Button>
  </section>
</template>

<script setup lang='ts'>
import { SortDir } from 'enums/sort_dir.ts';
import { SortKey } from 'enums/sort_key.ts';
import { useRouterStore } from 'stores/router.ts';

const $store = useRouterStore();
</script>
