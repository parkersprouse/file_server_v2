<template>
  <Menubar class='justify-between items-center border-x-0 border-t-0'>
    <section class='flex justify-evenly items-center gap-2 h-full'>
      <NavBreadcrumbs />
    </section>

    <!-- mobile view sheet trigger -->
    <section
      v-if='is_mobile'
      class='flex justify-end items-center h-full'
    >
      <MobileSheet />
    </section>

    <!-- desktop view inline elements -->
    <section
      v-else
      class='flex justify-evenly items-center h-full'
    >
      <ViewSelect ghost />
      <SortSelect ghost />
      <ThemeToggle />
    </section>
  </Menubar>
</template>

<script setup lang='ts'>
import { useIsMobile } from '@/composables/is_mobile.ts';
const is_mobile = useIsMobile();
</script>
