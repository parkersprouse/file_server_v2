<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <RouterLink
        :to='buildEntryRoute(entry, $route)'
        class='entry'
        :class='{ "entry--linked": is_linked }'
      >
        <slot name='default' />
      </RouterLink>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <EntryContextMenuCopyLink :entry='entry' />
    </ContextMenuContent>
  </ContextMenu>
</template>

<script setup lang='ts'>
import { computed } from 'vue';

import { buildEntryRoute } from 'lib/entry_helpers.ts';
import { useRouterStore } from 'stores/router.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $router_store = useRouterStore();

const is_linked = computed<boolean>(() =>
  $router_store.linked !== undefined && $router_store.linked === entry.name);
</script>
