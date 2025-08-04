<template>
  <Menubar class='justify-between items-center'>
    <section class='flex justify-evenly items-center gap-1 h-full'>
      <NavBreadcrumbs />
    </section>
    <section class='flex justify-evenly items-center gap-1 h-full'>
      <Separator orientation='vertical' />
      <ThemeToggle />
    </section>
  </Menubar>
</template>

<script setup lang='ts'>
import NavBreadcrumbs from 'components/NavBar/NavBreadcrumbs.vue';
import ThemeToggle from 'components/NavBar/ThemeToggle.vue';
import { Menubar } from 'ui/menubar/index.ts';
import { Separator } from 'ui/separator/index.ts';
</script>
