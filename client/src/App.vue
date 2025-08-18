<template>
  <RouterView />
  <Tooltip />
  <!--
  <PreviewDialog />
  -->
</template>

<script setup lang='ts'>
import { RouterView } from 'vue-router';

import { useDark } from 'composables/theme.ts';

useDark(); // If there's a locally saved theme, load it
</script>
