<template>
  <Tooltip
    :delay-duration='250'
    :disable-closing-trigger='true'
    :disable-hoverable-content='true'
    :skip-delay-duration='300'
  >
    <TooltipTrigger as-child>
      <Button
        variant='ghost'
        aria-label='Toggle Line Wrap'
        class='ghost-ext h-auto!'
        :class='{ "ghost-ext--active": $store.preview_text_wrapped }'
        @click='$store.togglePreviewLineWrap()'
      >
        <ricon-text-wrap />
      </Button>
    </TooltipTrigger>
    <TooltipContent
      side='bottom'
      to='.preview-dialog__actions'
    >
      <div class='text-center'>
        Toggle Line Wrap
      </div>
    </TooltipContent>
  </Tooltip>
</template>

<script setup lang='ts'>
import { useStore } from 'stores/global.ts';

const $store = useStore();
</script>
