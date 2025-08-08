<template>
  <section
    class='flex flex-row flex-nowrap justify-center items-center w-full'
    :class='$is_mobile ? "gap-4" : "gap-0"'
  >
    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant='ghost'
          class='p-1! h-auto'
          @click='active_view = ViewType.LIST'
        >
          <icon-list-dashes
            :class='{
              "text-teal-600 dark:text-teal-800": active_view === ViewType.LIST,
              "size-12!": $is_mobile,
              "size-6!": !$is_mobile,
            }'
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        List View
      </TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant='ghost'
          class='p-1! h-auto'
          @click='active_view = ViewType.ROWS'
        >
          <icon-rows-fill
            v-if='active_view === ViewType.ROWS'
            class='text-teal-600 dark:text-teal-800'
            :class='$is_mobile ? "size-12!" : "size-6!"'
          />
          <icon-rows
            v-else
            :class='$is_mobile ? "size-12!" : "size-6!"'
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Row View
      </TooltipContent>
    </Tooltip>

    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant='ghost'
          class='p-1! h-auto'
          @click='active_view = ViewType.GRID'
        >
          <icon-squares-four-fill
            v-if='active_view === ViewType.GRID'
            class='text-teal-600 dark:text-teal-800'
            :class='$is_mobile ? "size-12!" : "size-6!"'
          />
          <icon-squares-four
            v-else
            :class='$is_mobile ? "size-12!" : "size-6!"'
          />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        Grid View
      </TooltipContent>
    </Tooltip>
  </section>
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { onBeforeMount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useIsMobile } from 'composables/is_mobile.ts';
import { ViewType } from 'types/view_type.ts';

const $is_mobile = useIsMobile();
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
