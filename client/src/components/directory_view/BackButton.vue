<template>
  <RouterLink
    v-if='previous_path'
    :to='{
      path: previous_path,
      query: { ...$route.query },
    }'
    class='dir-back-btn'
  >
    <icon-caret-left aria-hidden='true' />
    Back
  </RouterLink>
</template>

<script setup lang='ts'>
import { get } from '@vueuse/core';
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import { useRouterStore } from 'stores/router.ts';

const $route = useRoute();
const $router_store = useRouterStore();

const at_root = computed<boolean>(() => $route.path === '/');
const previous_path = computed<string | undefined>(() => {
  const { breadcrumbs } = $router_store;
  if (get(at_root) || breadcrumbs.length === 0) return;
  if (breadcrumbs.length === 1) return '/';
  return breadcrumbs[breadcrumbs.length - 2]?.path;
});
</script>

<style>
@reference '../../assets/styles/index.css';

.dir-back-btn {
  @apply inline-flex justify-center items-center gap-1 z-500 w-fit
        hover:text-accent-text;
}
</style>
