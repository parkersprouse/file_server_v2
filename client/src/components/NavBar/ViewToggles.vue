<template>
  <section class='flex flex-row flex-nowrap justify-center items-center gap-4 w-full'>
    <Button
      variant='ghost'
      class='p-1! h-auto'
      @click='active_view = ViewType.LIST'
    >
      <icon-list-dashes-fill
        v-if='active_view === ViewType.LIST'
        class='size-12! text-teal-600 dark:text-teal-800'
      />
      <icon-list-dashes
        v-else
        class='size-12!'
      />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto'
      @click='active_view = ViewType.ROWS'
    >
      <icon-rows-fill
        v-if='active_view === ViewType.ROWS'
        class='size-12! text-teal-600 dark:text-teal-800'
      />
      <icon-rows
        v-else
        class='size-12!'
      />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto'
      @click='active_view = ViewType.GRID'
    >
      <icon-squares-four-fill
        v-if='active_view === ViewType.GRID'
        class='size-12! text-teal-600 dark:text-teal-800'
      />
      <icon-squares-four
        v-else
        class='size-12!'
      />
    </Button>
  </section>
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { onBeforeMount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ViewType } from 'types/view_type.ts';

const $route = useRoute();
const $router = useRouter();

const active_view = ref<ViewType>();

watch(active_view, (new_value) => {
  if (!new_value) return;
  $router.push({
    force: true,
    query: {
      ...$route.query,
      view_type: get(active_view),
    },
  });
});

function verifyViewType(view_type: ViewType): boolean {
  return Object.values(ViewType).includes(view_type);
}

onBeforeMount(() => {
  const { view_type } = $route.query;
  if (view_type && verifyViewType(view_type as ViewType)) {
    set(active_view, view_type);
  } else {
    set(active_view, ViewType.LIST);
  }
});
</script>
