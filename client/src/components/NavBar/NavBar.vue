<template>
  <Menubar class='justify-between items-center'>
    <section class='flex justify-evenly items-center gap-2 h-full'>
      <NavBreadcrumbs />
    </section>
    <section class='flex justify-evenly items-center gap-2 h-full'>
      <SortSelect />
      <ThemeToggle />
    </section>
  </Menubar>
</template>

<script setup lang='ts'>
import { Menubar } from 'ui/menubar/index.ts';
</script>
