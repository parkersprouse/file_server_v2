<template>
  <Tooltip
    :delay-duration='500'
    :disable-closing-trigger='true'
    :disable-hoverable-content='true'
    :skip-delay-duration='300'
  >
    <TooltipTrigger as-child>
      <Badge
        :variant='variant'
        class='entry-meta entry-meta__last-modified'
      >
        <icon-clock-counter-clockwise />
        {{ relative(entry.last_modified_at) }}
      </Badge>
    </TooltipTrigger>
    <TooltipContent>
      <div class='text-center'>
        Last modified on
        <br>
        {{ absolute(entry.last_modified_at) }}
      </div>
    </TooltipContent>
  </Tooltip>
</template>

<script setup lang='ts'>
import { absolute, relative } from 'lib/datetime.ts';

import type { Entry } from 'types/entry.d.ts';

const { variant = 'outline' } = defineProps<{
  entry: Entry;
  variant?: 'ghost' | 'outline';
}>();
</script>
