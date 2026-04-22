<template>
  <section class='flex flex-row flex-nowrap justify-center items-center w-full gap-4'>
    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.view === ViewType.LIST }'
      @click='$store.view = ViewType.LIST'
    >
      <icon-list-dashes class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.view === ViewType.ROWS }'
      @click='$store.view = ViewType.ROWS'
    >
      <icon-rows class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.view === ViewType.GRID }'
      @click='$store.view = ViewType.GRID'
    >
      <icon-squares-four class='size-12!' />
    </Button>
  </section>
</template>

<script setup lang='ts'>
import { ViewType } from 'enums/view_type.ts';
import { useRouterStore } from 'stores/router.ts';

const $store = useRouterStore();
</script>
