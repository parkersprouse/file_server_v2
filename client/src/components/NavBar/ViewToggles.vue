<template>
  <section class='flex flex-row flex-nowrap justify-center items-center w-full gap-4'>
    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": active_view === ViewType.LIST }'
      @click='active_view = ViewType.LIST'
    >
      <icon-list-dashes class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": active_view === ViewType.ROWS }'
      @click='active_view = ViewType.ROWS'
    >
      <icon-rows class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": active_view === ViewType.GRID }'
      @click='active_view = ViewType.GRID'
    >
      <icon-squares-four class='size-12!' />
    </Button>
  </section>
</template>

<script setup lang='ts'>
import { set } from '@vueuse/core';
import { onBeforeMount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ViewType } from 'types/view_type.ts';

const $route = useRoute();
const $router = useRouter();

const active_view = ref<ViewType>(ViewType.LIST);

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
