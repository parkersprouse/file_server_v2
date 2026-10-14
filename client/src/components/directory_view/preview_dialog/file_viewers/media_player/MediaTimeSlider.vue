<template>
  <media-time-slider class='preview-media-player__slider preview-media-player__slider--time'>
    <media-slider-track class='preview-media-player__slider-track'>
      <media-slider-buffer class='preview-media-player__slider-buffer' />
      <media-slider-fill class='preview-media-player__slider-fill' />
    </media-slider-track>
    <media-slider-thumb class='preview-media-player__slider-thumb' />
    <media-slider-preview class='preview-media-player__slider-preview'>
      <media-slider-value type='pointer' />
    </media-slider-preview>
  </media-time-slider>
</template>

<script setup lang='ts'>
import './register.ts';
</script>
