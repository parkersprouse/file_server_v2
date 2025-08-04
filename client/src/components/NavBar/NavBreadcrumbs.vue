<template>
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <component
          :href='at_root ? undefined : "/"'
          :is='at_root ? BreadcrumbPage : BreadcrumbLink'
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
            :href='crumb.path'
            :is='Boolean(crumb.path) ? BreadcrumbLink : BreadcrumbPage'
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
import { useRoute } from 'vue-router';

import { breadcrumbify } from 'lib/utils.ts';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from 'ui/breadcrumb/index.ts';

const $route = useRoute();

const at_root = computed(() => $route.path === '/');
const breadcrumbs = computed(() => breadcrumbify($route).slice(1));
</script>
