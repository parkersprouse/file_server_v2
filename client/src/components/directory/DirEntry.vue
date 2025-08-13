<template>
  <RouterLink
    :to='buildEntryRoute(entry, $route)'
    class='entry'
  >
    <slot name='default' />
  </RouterLink>
</template>

<script setup lang='ts'>
import { buildEntryRoute } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
}>();
</script>
