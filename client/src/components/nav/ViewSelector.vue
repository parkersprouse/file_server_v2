<template>
  <DropdownMenu :modal='false'>
    <DropdownMenuTrigger
      style='flex: 1 0 auto;'
      class='flex flex-row flex-nowrap justify-center items-center self-stretch gap-1 w-auto h-auto p-1.5! ghost-ext'
      :class='props.class ?? ""'
    >
      <component
        :is='icons[$store.view]'
        class='size-6!'
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent class='p-0!'>
      <DropdownMenuGroup>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.view === ViewType.LIST }'
          @click='$store.view = ViewType.LIST'
        >
          <icon-list-dashes class='size-6!' />
          List
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.view === ViewType.ROWS }'
          @click='$store.view = ViewType.ROWS'
        >
          <icon-rows class='size-6!' />
          Rows
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.view === ViewType.GRID }'
          @click='$store.view = ViewType.GRID'
        >
          <icon-squares-four class='size-6!' />
          Grid
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang='ts'>
import IconListDashes from '~icons/ph/list-dashes';
import IconRows from '~icons/ph/rows';
import IconSquaresFour from '~icons/ph/squares-four';

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
