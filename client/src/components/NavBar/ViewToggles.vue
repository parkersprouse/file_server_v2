<template>
  <section class='flex flex-row flex-nowrap justify-center items-center w-full gap-4'>
    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.active_view === ViewType.LIST }'
      @click='$store.setView(ViewType.LIST)'
    >
      <icon-list-dashes class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.active_view === ViewType.ROWS }'
      @click='$store.setView(ViewType.ROWS)'
    >
      <icon-rows class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.active_view === ViewType.GRID }'
      @click='$store.setView(ViewType.GRID)'
    >
      <icon-squares-four class='size-12!' />
    </Button>
  </section>
</template>

<script setup lang='ts'>
import { ViewType } from 'enums/view_type.ts';
import { useStore } from 'stores/global.ts';

const $store = useStore();
</script>
