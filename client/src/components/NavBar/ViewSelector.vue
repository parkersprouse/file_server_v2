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
        :is='icons[active_view]'
        class='size-6!'
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent>
      <DropdownMenuGroup>

        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": active_view === ViewType.LIST }'
          @click='active_view = ViewType.LIST'
        >
          <icon-list-dashes
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": active_view === ViewType.LIST }'
          />
          List View
        </DropdownMenuItem>

        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": active_view === ViewType.ROWS }'
          @click='active_view = ViewType.ROWS'
        >
          <icon-rows
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": active_view === ViewType.ROWS }'
          />
          Rows View
        </DropdownMenuItem>

        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": active_view === ViewType.GRID }'
          @click='active_view = ViewType.GRID'
        >
          <icon-squares-four
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": active_view === ViewType.GRID }'
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

import { set } from '@vueuse/core';
import { onBeforeMount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ViewType } from 'types/view_type.ts';

const {
  class: klass = null,
} = defineProps<{
  class?: string;
}>();

const $route = useRoute();
const $router = useRouter();

const active_view = ref<ViewType>(ViewType.LIST);

const icons = ref({
  grid: IconSquaresFour,
  list: IconListDashes,
  rows: IconRows,
});

watch(active_view, (new_value) => {
  $router.push({
    force: true,
    query: {
      ...$route.query,
      view_type: new_value || undefined,
    },
  });
});

onBeforeMount(() => {
  const view_type: ViewType = $route.query.view_type as ViewType;
  if (Object.values(ViewType).includes(view_type)) set(active_view, view_type);
});
</script>
