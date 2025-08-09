<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <Button
        variant='ghost'
        class='p-1! h-auto ghost-ext'
        :class='!$is_mobile ? "self-stretch" : ""'
        @click='$is_dark = !$is_dark'
      >
        <icon-sun-fill
          v-if='$is_dark'
          :class='$is_mobile ? "size-8!" : "size-5!"'
        />
        <icon-moon-fill
          v-else
          :class='$is_mobile ? "size-8!" : "size-5!"'
        />
      </Button>
    </TooltipTrigger>
    <TooltipContent>
      {{ $is_dark ? 'Light Mode' : 'Dark Mode' }}
    </TooltipContent>
  </Tooltip>
</template>

<script setup lang='ts'>
import { useIsMobile } from 'composables/is_mobile.ts';
import { useDark } from 'composables/theme.ts';
import { Button } from 'ui/button/index.ts';

const $is_dark = useDark();
const $is_mobile = useIsMobile();
</script>
