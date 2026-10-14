<template>
  <button
    type='button'
    role='switch'
    aria-label='Loop'
    :aria-checked='looping'
    :data-looping='looping || undefined'
    @click='looping = !looping'
  >
    <svg
      v-if='looping'
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      viewBox='0 0 24 24'
      fill='currentColor'
    >
      <path :d='LOOP_ON_PATH' />
    </svg>
    <svg
      v-else
      xmlns='http://www.w3.org/2000/svg'
      aria-hidden='true'
      viewBox='0 0 24 24'
      fill='currentColor'
      fill-rule='evenodd'
      clip-rule='evenodd'
    >
      <path
        fill-rule='nonzero'
        :d='LOOP_OFF_PATH'
      />
      <path
        fill-rule='nonzero'
        :d='LOOP_OFF_CROSS_PATH'
      />
    </svg>
  </button>
</template>

<script setup lang='ts'>
// Video.js has no loop state or loop control, so this is a plain switch over
// the media element's native `loop` property (the migration guide's advice for
// anything outside player state), with the state owned by `useMediaLooping`.
// The icons media-chrome's loop button drew (looping on / off).
const LOOP_ON_PATH = 'M6 4H21C21.5523 4 22 4.44772 22 5V12H20V6H6V9L1 5L6 1V4Z' +
  'M18 20H3C2.44772 20 2 19.5523 2 19V12H4V18H18V15L23 19L18 23V20Z';
const LOOP_OFF_PATH = 'M6 4h15a1 1 0 0 1 1 1v7h-2V6H6v3L1 5l5-4zm12 16H3a1 1 0 0 1-1-1v-7h2v6h14v-3l5 4-5 4z';
const LOOP_OFF_CROSS_PATH = 'm12 10.94 3.71-3.71 1.06 1.06L13.06 12l3.71 3.71-1.06 1.06-3.71-3.7' +
  '-3.71 3.7-1.06-1.06 3.71-3.7-3.71-3.72 1.06-1.06z';

const looping = defineModel<boolean>('looping', { required: true });
</script>
