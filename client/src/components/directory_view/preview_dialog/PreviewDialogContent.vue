<template>
  <div :class='cn("preview-dialog__wrapper", props.class_wrapper)'>
    <div
      ref='content'
      :class='cn("preview-dialog__content", props.class_content)'
    >
      <slot name='default' />
    </div>
  </div>
</template>

<script setup lang='ts'>
import { cn } from 'lib/utils.ts';

import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class_content?: HTMLAttributes['class'];
  class_wrapper?: HTMLAttributes['class'];
}>();
</script>
