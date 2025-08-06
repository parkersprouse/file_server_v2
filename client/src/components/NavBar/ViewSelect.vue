<template>
  <Select v-model='active_view'>
    <SelectTrigger :class='{
      "bg-transparent! hover:bg-input/50! border-none!": ghost,
      [klass ?? ""]: true,
    }'>
      <SelectValue placeholder='View'>
        <slot v-if='active_view'>
          <icon-squares-four v-if='active_view === "grid"' />
          <icon-rows v-else-if='active_view === "rows"' />
          <icon-list-dashes v-else />
          {{ active_view_labelized }}
        </slot>
      </SelectValue>
    </SelectTrigger>

    <SelectContent>
      <SelectGroup>
        <SelectItem value='grid'>
          <icon-squares-four />
          <SelectItemText>
            Grid
          </SelectItemText>
        </SelectItem>
        <SelectItem value='row'>
          <icon-rows />
          <SelectItemText>
            Row
          </SelectItemText>
        </SelectItem>
        <SelectItem value='list'>
          <icon-list-dashes />
          <SelectItemText>
            List
          </SelectItemText>
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { computed, onBeforeMount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { ViewType } from 'types/view_type.ts';

const {
  class: klass = null,
  ghost = false,
} = defineProps<{
  class?: string;
  ghost?: boolean;
}>();

const $route = useRoute();
const $router = useRouter();

const active_view = ref<ViewType>();

const active_view_labelized = computed<string | undefined>(() => {
  const label = get(active_view);
  if (!label) return;
  return `${label[0].toUpperCase()}${label.substring(1).toLowerCase()}`;
});

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
    set(active_view, 'list' as ViewType);
  }
});
</script>
