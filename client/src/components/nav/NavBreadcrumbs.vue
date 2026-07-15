<template>
  <Breadcrumb>
    <BreadcrumbList :class='["scrollbar-hidden", $is_mobile ? "" : "text-sm!"]'>
      <BreadcrumbItem>
        <component
          :to='at_root ? undefined : { path: "/", query: { ...stripTransientParams($route.query) } }'
          :is='at_root ? BreadcrumbPage : RouterLink'
          class='inline-flex justify-center items-center gap-1'
        >
          [home]
        </component>
      </BreadcrumbItem>

      <template v-if='collapsed_crumbs.length > 0'>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <DropdownMenu :modal='false'>
            <DropdownMenuTrigger
              class='hover:text-foreground transition-colors'
              aria-label='Show hidden pages'
            >
              <BreadcrumbEllipsis />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                v-for='crumb of collapsed_crumbs'
                :key='crumb.path'
                as-child
              >
                <RouterLink
                  class='ghost-ext'
                  :to='{ path: crumb.path, query: { ...stripTransientParams($route.query) } }'
                >
                  {{ crumb.label }}
                </RouterLink>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
      </template>

      <slot
        v-for='crumb of visible_crumbs'
        :key='crumb.path'
      >
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <component
            :to='{ path: crumb.path, query: { ...stripTransientParams($route.query) } }'
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

import { useIsMobile } from 'composables/is_mobile.ts';
import { stripTransientParams } from 'lib/utils.ts';
import { useRouterStore } from 'stores/router.ts';
import { BreadcrumbPage } from 'ui/breadcrumb/index.ts';

const { hiddenCount = 0 } = defineProps<{
  // Number of leading crumbs (after the root entry) to fold into the
  //   overflow menu; computed by `useBreadcrumbCollapse` in NavBar.vue.
  hiddenCount?: number;
}>();

const $is_mobile = useIsMobile();
const $route = useRoute();
const $router_store = useRouterStore();

const at_root = computed<boolean>(() => $route.path === '/');
const collapsed_crumbs = computed(() => $router_store.breadcrumbs.slice(0, hiddenCount));
const visible_crumbs = computed(() => $router_store.breadcrumbs.slice(hiddenCount));
</script>

<style>
@reference '../../assets/styles/index.css';

.breadcrumb-wrapper {
  & nav {
    @apply w-fit;

    & ol,
    & ul {
      @apply w-full flex-nowrap overflow-y-hidden overflow-x-visible whitespace-nowrap text-nowrap;
      overflow-wrap: normal;

      & li {
        @apply flex-nowrap;

        &::before {
          @apply hidden;
        }

        & a {
          @apply border-b border-transparent border-dotted focus:border-primary hover:border-primary;
        }
      }
    }
  }
}
</style>
