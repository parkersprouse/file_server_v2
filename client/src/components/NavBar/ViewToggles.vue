<template>
  <section
    class='flex flex-row flex-nowrap justify-center items-center w-full'
    :class='$is_mobile ? "gap-4" : "gap-0"'
  >
    <Tooltip>
      <TooltipTrigger as-child>
        <Button
          variant='ghost'
          class='p-1! h-auto self-stretch ghost-ext'
          :class='{ "ghost-ext--active": active_view === ViewType.LIST }'
          @click='active_view = ViewType.LIST'
        >
          <icon-list-dashes :class='[size_class]' />
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
          class='p-1! h-auto self-stretch ghost-ext'
          :class='{ "ghost-ext--active": active_view === ViewType.ROWS }'
          @click='active_view = ViewType.ROWS'
        >
          <icon-rows :class='[size_class]' />
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
          class='p-1! h-auto self-stretch ghost-ext'
          :class='{ "ghost-ext--active": active_view === ViewType.GRID }'
          @click='active_view = ViewType.GRID'
        >
          <icon-squares-four :class='[size_class]' />
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
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useIsMobile } from 'composables/is_mobile.ts';
import { ViewType } from 'types/view_type.ts';

const $is_mobile = useIsMobile();
const $route = useRoute();
const $router = useRouter();

const active_view = ref<ViewType>();

const size_class = computed<string>(() => get($is_mobile) ? 'size-12!' : 'size-6!');

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
