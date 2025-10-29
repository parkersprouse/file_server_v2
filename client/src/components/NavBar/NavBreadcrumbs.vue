<template>
  <Breadcrumb>
    <BreadcrumbList class='scrollbar-hidden'>
      <BreadcrumbItem>
        <component
          :to='at_root ? undefined : { path: "/", query: { ...$route.query } }'
          :is='at_root ? BreadcrumbPage : RouterLink'
          class='inline-flex justify-center items-center gap-1'
        >
          [home]
        </component>
      </BreadcrumbItem>
      <slot
        v-for='crumb of $router_store.breadcrumbs'
        :key='crumb.path'
      >
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <component
            :to='{ path: crumb.path, query: { ...$route.query } }'
            :is='Boolean(crumb.path) ? RouterLink : BreadcrumbPage'
          >
            {{ crumb.label }}
          </component>
        </BreadcrumbItem>
      </slot>
    </BreadcrumbList>
  </Breadcrumb>
</template>

<script setup lang='ts'>
import { computed } from 'vue';
import { RouterLink, useRoute } from 'vue-router';

import { useRouterStore } from 'stores/router.ts';
import { BreadcrumbPage } from 'ui/breadcrumb/index.ts';

const $route = useRoute();
const $router_store = useRouterStore();

const at_root = computed<boolean>(() => $route.path === '/');
</script>

<style>
@reference '../../assets/styles/index.css';

nav {
  & ol,
  & ul {
    @apply flex-nowrap overflow-y-hidden overflow-x-auto whitespace-nowrap text-nowrap;
    overflow-wrap: normal;

    & li {
      @apply flex-nowrap;

      &::before {
        @apply hidden;
      }

      & a {
        @apply border-b border-transparent border-dotted;

        @variant hover {
          @apply border-primary;
        }
      }
    }
  }
}
</style>
