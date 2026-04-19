<template>
  <VirtualizedContent :entries='entries' />
</template>

<script setup lang='ts'>
import VirtualizedContent from 'components/directory_view/VirtualizedContent.vue';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entries: Entry[];
}>();
</script>
