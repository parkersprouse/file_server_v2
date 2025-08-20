<template>
  <audio
    :src='entry.url'
    controls
    class='max-w-full max-h-full w-full h-auto object-contain'
  />
</template>

<script setup lang='ts'>
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();
</script>
