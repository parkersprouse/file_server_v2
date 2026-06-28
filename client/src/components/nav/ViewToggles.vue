<template>
  <section class='flex flex-row flex-nowrap justify-center items-center w-full gap-4'>
    <Button
      variant='ghost'
      aria-label='List view'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.view === ViewType.LIST }'
      :aria-pressed='$store.view === ViewType.LIST'
      @click='$store.view = ViewType.LIST'
    >
      <icon-list-dashes aria-hidden='true' class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      aria-label='Rows view'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.view === ViewType.ROWS }'
      :aria-pressed='$store.view === ViewType.ROWS'
      @click='$store.view = ViewType.ROWS'
    >
      <icon-rows aria-hidden='true' class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      aria-label='Grid view'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": $store.view === ViewType.GRID }'
      :aria-pressed='$store.view === ViewType.GRID'
      @click='$store.view = ViewType.GRID'
    >
      <icon-squares-four aria-hidden='true' class='size-12!' />
    </Button>
  </section>
</template>

<script setup lang='ts'>
import { ViewType } from 'enums/view_type.ts';
import { useRouterStore } from 'stores/router.ts';

const $store = useRouterStore();
</script>
