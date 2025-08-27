<template>
  <TooltipProvider>
    <RouterView />
  </TooltipProvider>
  <PreviewDialog />
</template>

<script setup lang='ts'>
import { watch } from 'vue';
import { RouterView } from 'vue-router';

import { useIsMobile } from 'composables/is_mobile.ts';
import { useDark } from 'composables/theme.ts';

useDark(); // Load the locally saved theme, if there is one

const $is_mobile = useIsMobile();

watch($is_mobile, (now_mobile) => {
  if (now_mobile) {
    document.body.classList.add('scrollbar-hidden');
  } else {
    document.body.classList.remove('scrollbar-hidden');
  }
}, { immediate: true });
</script>
