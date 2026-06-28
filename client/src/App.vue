<template>
  <TooltipProvider>
    <a href='#main-content' class='skip-link'>Skip to main content</a>
    <RouterView />
  </TooltipProvider>
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

<style>
.skip-link {
  position: absolute;
  left: -9999px;
  z-index: 99999;
  padding: 0.5rem 1rem;
  background: var(--background);
  color: var(--foreground);
  border: 2px solid var(--border);
  text-decoration: none;

  &:focus-visible {
    left: 0.5rem;
    top: 0.5rem;
    outline: 2px solid currentColor !important;
    outline-offset: 2px !important;
  }
}
</style>
