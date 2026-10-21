<template>
  <DropdownMenu :modal='false'>
    <DropdownMenuTrigger
      style='flex: 1 0 auto;'
      class='flex flex-row flex-nowrap justify-center items-center self-stretch gap-1 w-auto h-auto p-1.5! ghost-ext'
      :class='props.class ?? ""'
      :aria-label='"Layout: " + $store.view'
    >
      <component
        :is='icons[$store.view]'
        aria-hidden='true'
        class='size-6!'
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent :side-offset='0'>
      <DropdownMenuGroup>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.view === ViewType.LIST }'
          @click='$store.view = ViewType.LIST'
        >
          <icon-list class='size-6!' />
          List
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.view === ViewType.ROWS }'
          @click='$store.view = ViewType.ROWS'
        >
          <icon-stretch-horizontal class='size-6!' />
          Rows
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.view === ViewType.GRID }'
          @click='$store.view = ViewType.GRID'
        >
          <icon-layout-grid class='size-6!' />
          Grid
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang='ts'>
import IconSquaresFour from '~icons/lucide/layout-grid';
import IconListDashes from '~icons/lucide/list';
import IconRows from '~icons/lucide/stretch-horizontal';

import { ref } from 'vue';

import { ViewType } from 'enums/view_type.ts';
import { useRouterStore } from 'stores/router.ts';

import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const $store = useRouterStore();

const icons = ref({
  grid: IconSquaresFour,
  list: IconListDashes,
  rows: IconRows,
});
</script>
