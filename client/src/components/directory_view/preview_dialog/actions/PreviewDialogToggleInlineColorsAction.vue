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
        aria-label='Toggle Inline CSS Colors'
        class='ghost-ext h-auto!'
        :class='{ "ghost-ext--active": !$store.preview_inline_colors_disabled }'
        @click='$store.toggleInlineColorsPreview()'
      >
        <icon-swatches v-if='$store.preview_inline_colors_disabled' />
        <icon-swatches-fill v-else />
      </Button>
    </TooltipTrigger>
    <TooltipContent
      side='bottom'
      to='.preview-dialog__actions'
    >
      <div class='text-center'>
        Toggle Inline CSS Colors
      </div>
    </TooltipContent>
  </Tooltip>
</template>

<script setup lang='ts'>
import { useStore } from 'stores/global.ts';

const $store = useStore();
</script>
