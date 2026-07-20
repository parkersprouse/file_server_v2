<template>
  <Badge
    v-if='Boolean(entry.duration)'
    :variant='variant'
    class='entry-meta entry-meta__duration'
  >
    <icon-timer />
    {{ entry.duration }}
  </Badge>
</template>

<script setup lang='ts'>
import type { Entry } from 'types/entry.d.ts';

const { variant = 'outline' } = defineProps<{
  entry: Entry;
  variant?: 'ghost' | 'outline';
}>();
</script>
