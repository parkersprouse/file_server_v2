<template>
  <Menubar
    id='toolbar'
    class='z-10 fixed top-0 left-0 right-0 h-fit justify-between items-center border-x-0 border-t-0 py-0 px-1'
  >
    <section class='flex justify-evenly items-center gap-2 h-full'>
      <NavBreadcrumbs />
    </section>

    <!-- mobile view sheet trigger -->
    <section
      v-if='$is_mobile'
      class='flex justify-end items-center h-full'
    >
      <MobileSheet />
    </section>

    <!-- desktop view inline elements -->
    <section
      v-else
      class='flex justify-evenly items-center h-full'
    >
      <Separator
        orientation='vertical'
        class='h-auto! self-stretch! mx-1 bg-zinc-300 dark:bg-zinc-700'
      />
      <ViewSelector />
      <Separator
        orientation='vertical'
        class='h-auto! self-stretch! mx-1 bg-zinc-300 dark:bg-zinc-700'
      />
      <SortSelector />
      <Separator
        orientation='vertical'
        class='h-auto! self-stretch! mx-1 bg-zinc-300 dark:bg-zinc-700'
      />
      <ThemeToggle />
    </section>
  </Menubar>
</template>

<script setup lang='ts'>
import { useThrottleFn } from '@vueuse/core';
import { onMounted, onUnmounted } from 'vue';

import { useStore } from '@/stores/global.ts';
import { useIsMobile } from 'composables/is_mobile.ts';

const $is_mobile = useIsMobile();
const $store = useStore();

const onResize = useThrottleFn((entries) => {
  const entry = entries[0];
  const target = entry.target as HTMLElement;
  $store.toolbar_height = target.offsetHeight;
}, 100);

const observer = new ResizeObserver((entries) => onResize(entries));

onMounted(() => {
  const toolbar = document.getElementById('toolbar');
  if (toolbar) observer.observe(toolbar);
});

onUnmounted(() => {
  observer.disconnect();
});
</script>
