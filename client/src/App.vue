<template>
  <Suspense @resolve='main_ready = true'>
    <TooltipProvider>
      <RouterView v-if='main_ready' />
    </TooltipProvider>
  </Suspense>

  <Suspense @resolve='dialog_ready = true'>
    <PreviewDialog v-if='dialog_ready' />
  </Suspense>
</template>

<script setup lang='ts'>
import { ref, watch } from 'vue';
import { RouterView } from 'vue-router';

import { useIsMobile } from 'composables/is_mobile.ts';
import { useDark } from 'composables/theme.ts';

useDark(); // Load the locally saved theme, if there is one

const $is_mobile = useIsMobile();

const dialog_ready = ref<boolean>(false);
const main_ready = ref<boolean>(false);

watch($is_mobile, (now_mobile) => {
  if (now_mobile) {
    document.body.classList.add('scrollbar-hidden');
  } else {
    document.body.classList.remove('scrollbar-hidden');
  }
}, { immediate: true });
</script>
