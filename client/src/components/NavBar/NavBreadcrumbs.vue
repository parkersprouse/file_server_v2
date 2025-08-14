<template>
  <Breadcrumb>
    <BreadcrumbList>
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
        v-for='crumb of breadcrumbs'
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

import { breadcrumbify } from 'lib/utils.ts';
import { BreadcrumbPage } from 'ui/breadcrumb/index.ts';

import type { Breadcrumb } from 'types/breadcrumb.d.ts';

const $route = useRoute();

const at_root = computed<boolean>(() => $route.path === '/');
const breadcrumbs = computed<Breadcrumb[]>(() => breadcrumbify($route));
</script>

<style>
nav li::before {
  display: none;
}
</style>
