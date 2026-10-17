<template>
  <button
    type='button'
    role='switch'
    aria-label='Loop'
    :aria-checked='looping'
    :data-looping='looping || undefined'
    @click='looping = !looping'
  >
    <MediaLoopIcon
      class='media-button-icon'
      :looping='looping'
    />
  </button>
</template>

<script setup lang='ts'>
import MediaLoopIcon from './MediaLoopIcon.vue';

// Video.js has no loop state or loop control, so this is a plain switch over
// the media element's native `loop` property (the migration guide's advice for
// anything outside player state), with the state owned by `useMediaLooping`.
// It takes the skins' `media-button` class from its parent, so it sizes and
// hovers like its neighbours.
const looping = defineModel<boolean>('looping', { required: true });
</script>
