<template>
  <Button
    variant='ghost'
    class='p-1.5! h-auto ghost-ext'
    :class='!$is_mobile ? "self-stretch" : ""'
    @click='$is_dark = !$is_dark'
  >
    <icon-sun
      v-if='$is_dark'
      :class='$is_mobile ? "size-12!" : "size-6!"'
    />
    <icon-moon
      v-else
      :class='$is_mobile ? "size-12!" : "size-6!"'
    />
  </Button>
</template>

<script setup lang='ts'>
import { useIsMobile } from 'composables/is_mobile.ts';
import { useDark } from 'composables/theme.ts';
import { Button } from 'ui/button/index.ts';

const $is_dark = useDark();
const $is_mobile = useIsMobile();
</script>
