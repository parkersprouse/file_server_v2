<template>
  <RouterView />

  <Button variant='ghost'
    v-if='mode === "dark"'
    @click='mode = "light"'
  >
    <icon-sun-fill />
  </Button>

  <Button variant='ghost'
    v-else
    @click='mode = "dark"'
  >
    <icon-moon-fill />
  </Button>
</template>

<script setup lang='ts'>
import { useColorMode } from '@vueuse/core';
import { RouterView } from 'vue-router';

import { Button } from '@/components/ui/button/index.ts';

const mode = useColorMode({
  disableTransition: true,
  listenToStorageChanges: true,
  storage: localStorage,
  storageKey: 'theme',
});
</script>
