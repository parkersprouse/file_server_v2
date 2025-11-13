<template>
  <icon-circle-notch
    role='status'
    aria-label='Loading'
    :class='cn("size-4 animate-spin", props.class)'
  />

  <!--
  <icon-spinner-gap
    role='status'
    aria-label='Loading'
    :class='cn("size-4 animate-spin", props.class)'
  />
  -->
</template>

<script setup lang='ts'>
import { cn } from '@/lib/utils';

import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>
