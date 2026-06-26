<template>
  <PreviewDialogTooltip>
    <Button
      variant='ghost'
      aria-label='Zoom out'
      class='ghost-ext h-auto!'
      :disabled='!view.can_zoom_out'
      @click='view.zoomOut()'
    >
      <icon-magnifying-glass-minus />
    </Button>

    <template #content>
      Zoom Out
    </template>
  </PreviewDialogTooltip>

  <PreviewDialogTooltip>
    <button
      type='button'
      aria-label='Reset zoom'
      class='preview-dialog__zoom-level'
      @click.prevent='view.reset()'
    >
      {{ view.zoom_percent }}%
    </button>

    <template #content>
      Reset Zoom
    </template>
  </PreviewDialogTooltip>

  <PreviewDialogTooltip>
    <Button
      variant='ghost'
      aria-label='Zoom in'
      class='ghost-ext h-auto!'
      :disabled='!view.can_zoom_in'
      @click='view.zoomIn()'
    >
      <icon-magnifying-glass-plus />
    </Button>

    <template #content>
      Zoom In
    </template>
  </PreviewDialogTooltip>

  <Separator
    orientation='vertical'
    class='h-auto! self-stretch!'
  />

  <PreviewDialogTooltip>
    <Button
      variant='ghost'
      aria-label='Rotate left'
      class='ghost-ext h-auto!'
      @click='view.rotateCcw()'
    >
      <icon-arrow-counter-clockwise />
    </Button>

    <template #content>
      Rotate Left
    </template>
  </PreviewDialogTooltip>

  <PreviewDialogTooltip>
    <Button
      variant='ghost'
      aria-label='Rotate right'
      class='ghost-ext h-auto!'
      @click='view.rotateCw()'
    >
      <icon-arrow-clockwise />
    </Button>

    <template #content>
      Rotate Right
    </template>
  </PreviewDialogTooltip>

  <PreviewDialogTooltip>
    <Button
      variant='ghost'
      aria-label='Reset view'
      class='ghost-ext h-auto!'
      :disabled='!view.is_transformed'
      @click='view.reset()'
    >
      <icon-arrows-in />
    </Button>

    <template #content>
      Reset
    </template>
  </PreviewDialogTooltip>
</template>

<script setup lang='ts'>
import { useImageView } from 'composables/image_view.ts';

const view = useImageView();
</script>

<style>
@reference '../../../../assets/styles/index.css';

@layer app {
  .preview-dialog .preview-dialog__actions .preview-dialog__zoom-level {
    @apply shrink-0 px-1 text-center text-sm font-medium tabular-nums select-none
           text-muted-foreground hover:text-primary;

    min-width: 4ch;
  }
}
</style>
