<template>
  <Breadcrumb>
    <BreadcrumbList>
      <slot
        v-for='(crumb) of breadcrumbs'
        :key='crumb.path'
      >
        <BreadcrumbItem>
          <component
            :href='crumb.path'
            :is='Boolean(crumb.path) ? BreadcrumbLink : BreadcrumbPage'
          >
            {{ crumb.label }}
          </component>
        </BreadcrumbItem>
        <BreadcrumbSeparator v-if='crumb.path' />
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

const breadcrumbs = computed(() => breadcrumbify($route));
</script>
