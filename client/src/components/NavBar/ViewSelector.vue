<template>
  <DropdownMenu :modal='false'>
    <DropdownMenuTrigger
      style='flex: 1 0 auto;'
      class='flex flex-row flex-nowrap justify-center items-center self-stretch gap-1 w-auto h-auto p-1.5! ghost-ext'
      :class='{
        [klass ?? ""]: true,
      }'
    >
      <component
        :is='icons[$store.active_view]'
        class='size-6!'
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent class='p-0!'>
      <DropdownMenuGroup>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.active_view === ViewType.LIST }'
          @click='$store.setView(ViewType.LIST)'
        >
          <icon-list-dashes
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": $store.active_view === ViewType.LIST }'
          />
          List View
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.active_view === ViewType.ROWS }'
          @click='$store.setView(ViewType.ROWS)'
        >
          <icon-rows
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": $store.active_view === ViewType.ROWS }'
          />
          Rows View
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.active_view === ViewType.GRID }'
          @click='$store.setView(ViewType.GRID)'
        >
          <icon-squares-four
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": $store.active_view === ViewType.GRID }'
          />
          Grid View
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
import { useStore } from 'stores/global.ts';

const {
  class: klass = null,
} = defineProps<{
  class?: string;
}>();

const $store = useStore();

const icons = ref({
  grid: IconSquaresFour,
  list: IconListDashes,
  rows: IconRows,
});
</script>
