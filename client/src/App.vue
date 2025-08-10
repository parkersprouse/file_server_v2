<template>
  <TooltipProvider>
    <RouterView />
  </TooltipProvider>
</template>

<script setup lang='ts'>
import { RouterView } from 'vue-router';

import { useDark } from 'composables/theme.ts';

// Load the locally saved theme, if there is one
useDark();
</script>
