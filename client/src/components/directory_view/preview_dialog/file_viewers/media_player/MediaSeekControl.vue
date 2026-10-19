<template>
  <media-seek-button
    :id='id'
    :seconds='seconds'
    class='media-button media-seek-button'
  >
    <div class='media-seek-button-content'>
      <media-icon
        family='neutral'
        name='seek'
        :class='["media-button-icon", { "media-seek-button-backward-icon": backward }]'
      />
      <span
        class='media-seek-button-label'
        :class='backward ? "media-seek-button-backward-label" : "media-seek-button-forward-label"'
      >{{ Math.abs(seconds) }}</span>
    </div>
  </media-seek-button>
  <media-tooltip
    :trigger='id'
    boundary='viewport'
    side='top'
    class='media-popup media-popup-safe-area media-popup-transition media-popup-surface media-tooltip'
  >
    <media-tooltip-label />
    <media-tooltip-shortcut class='media-tooltip-shortcut' />
  </media-tooltip>
</template>

<script setup lang='ts'>
import { computed } from 'vue';

// The Neutral audio skin's seek button and its tooltip; a negative `seconds`
// seeks backward and mirrors the icon. `id` pairs the tooltip with its trigger.
const { id, seconds } = defineProps<{
  id: string;
  seconds: number;
}>();

const backward = computed<boolean>(() => seconds < 0);
</script>
