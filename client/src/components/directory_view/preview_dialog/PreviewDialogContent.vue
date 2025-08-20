<template>
  <div :class='cn("preview-dialog__wrapper", props.class)'>
    <div
      ref='content'
      :class='cn("preview-dialog__content", props.class)'
    >
      <slot name='default' />
    </div>
  </div>
</template>

<script setup lang='ts'>
import { onClickOutside } from '@vueuse/core';
import { onMounted, useTemplateRef } from 'vue';

import { cn } from 'lib/utils.ts';

import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const $emit = defineEmits<{
  close: [];
}>();

const content = useTemplateRef<HTMLDivElement>('content');

onMounted(() => {
  const action = document.querySelector('.preview-dialog__actions') as HTMLDivElement;

  onClickOutside(content, () => {
    $emit('close');
  }, { ignore: [action] });
});
</script>
