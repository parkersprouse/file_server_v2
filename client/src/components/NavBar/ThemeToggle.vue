<template>
  <Button
    variant='ghost'
    class='p-1! h-auto'
    @click='is_dark = !is_dark'
  >
    <icon-sun-fill
      v-if='is_dark'
      class='w-5! h-5!'
    />
    <icon-moon-fill
      v-else
      class='w-5! h-5!'
    />
  </Button>
</template>

<script setup lang='ts'>
import { useDark } from '@vueuse/core';

import { Button } from 'ui/button/index.ts';

const is_dark = useDark({
  attribute: 'class',
  disableTransition: true,
  initOnMounted: false,
  listenToStorageChanges: true,
  selector: 'html',
  storageKey: 'theme',
  valueDark: 'dark',
  valueLight: 'light',
});
</script>
