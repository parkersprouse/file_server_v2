<template>
  <!--
    Drawn on the Neutral icon set's 18px grid with its ~1.5px weight (the set
    has no loop icon); a slash marks looping off.
  -->
  <svg
    xmlns='http://www.w3.org/2000/svg'
    aria-hidden='true'
    viewBox='0 0 18 18'
    fill='none'
    stroke='currentColor'
    stroke-width='1.5'
    stroke-linecap='round'
    stroke-linejoin='round'
  >
    <path d='M2.75 8.5V7.25a3 3 0 0 1 3-3h9' />
    <path d='m12.75 2.25 2 2-2 2' />
    <path d='M15.25 9.5v1.25a3 3 0 0 1-3 3h-9' />
    <path d='m5.25 15.75-2-2 2-2' />
    <path
      v-if='!looping'
      d='m2.5 2.5 13 13'
    />
  </svg>
</template>

<script setup lang='ts'>
// Shared by the Loop switch and the narrow video player's Loop menu item.
const { looping } = defineProps<{
  looping: boolean;
}>();
</script>
