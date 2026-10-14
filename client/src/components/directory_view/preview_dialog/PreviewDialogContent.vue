<template>
  <div
    class='preview-dialog__content'
    :class='{
      "bg-zinc-300!": alt_background_active,
    }'
  >
    <slot name='default' />
  </div>
</template>

<script setup lang='ts'>
import { get, useToggle } from '@vueuse/core';
import { onMounted, onUnmounted, ref } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';

import type { UnsubscribeFunction } from 'emittery';

const $event_bus = useEventBus();
const event_unsubs = ref<UnsubscribeFunction[]>([]);
const [alt_background_active, toggleAltBackground] = useToggle(false);

onMounted(async () => {
  const toggle_bg_unsub = $event_bus.on('toggle_dialog_content_bg', () => {
    toggleAltBackground();
  });

  get(event_unsubs).push(toggle_bg_unsub);
});

onUnmounted(() => {
  for (const unsub of get(event_unsubs)) unsub();
});
</script>

<style>
@reference '../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__content {
      @apply flex flex-col flex-nowrap place-content-center px-4 w-fit h-auto
             max-w-full max-h-full overflow-hidden self-center;

      cursor: initial;

      & object {
        @apply w-full h-full max-w-full max-h-full;
      }

      /*
        Shared look for the Video.js preview players (VideoPreview /
        AudioPreview). Their UI is composed from bare Video.js components, which
        ship behaviour and state attributes but no styles, so this recreates
        the media-chrome look the app had: translucent control surfaces,
        24px icons, a slim range track, and the #232331 hover/focus fill.
      */
      & .preview-media-player {
        --media-control-background: rgb(20 20 30 / 70%);
        --media-control-hover-background: #232331;
        --media-control-color: rgb(238 238 238);
        --media-range-track-color: rgb(238 238 238 / 50%);
        --media-range-buffer-color: rgb(238 238 238 / 30%);

        &.preview-audio-player {
          --media-control-background: #0e0e15;
        }

        /* The player element owns state only; layout goes on its container. */
        @apply contents;

        & .preview-media-player__container {
          @apply relative block max-w-full max-h-full overflow-hidden outline-none text-sm;

          color: var(--media-control-color);
        }

        & .preview-media-player__media {
          @apply block max-w-full max-h-full;
        }

        & media-controls,
        & media-tooltip-group {
          @apply contents;
        }

        & .preview-media-player__controls-content {
          @apply flex flex-col pointer-events-none transition-opacity duration-1000;
        }

        /* Video overlays its controls on the picture; audio stacks them in flow. */
        &.preview-video-player .preview-media-player__controls-content {
          @apply absolute inset-0 justify-end;
        }

        /*
          media-chrome hid its chrome after 2s idle even while paused; Video.js
          keeps `data-visible` on while paused by design, so hide on
          `data-user-active` (same fixed 2s timer) — except while the controls
          hold keyboard focus. Audio sets `visibility='always'`, which keeps
          the user active.
        */
        & .preview-media-player__controls-content:not([data-user-active], :has(:focus-visible)) {
          @apply opacity-0;

          & * {
            @apply pointer-events-none!;
          }
        }

        & .preview-media-player__controls-content[data-user-active] {
          @apply transition-none;
        }

        & media-controls-group {
          @apply pointer-events-auto;
        }

        & .preview-media-player__bar {
          @apply flex flex-row flex-nowrap items-stretch w-full;

          background-color: var(--media-control-background);
        }

        & .preview-media-player__control {
          @apply inline-flex flex-row flex-nowrap items-center justify-center gap-1 p-2
                 cursor-pointer select-none whitespace-nowrap outline-none;

          color: var(--media-control-color);

          &:is(button, [role='button'], [role='switch']) {
            @variant hover {
              background-color: var(--media-control-hover-background);
            }
          }

          &:focus-visible {
            background-color: var(--media-control-hover-background);
            box-shadow: inset 0 0 0 2px rgb(27 127 204 / 90%);
          }

          &[hidden] {
            @apply hidden;
          }

          & svg {
            @apply size-6 shrink-0;
          }
        }

        /* State-driven icon swaps (Video.js reflects state as data-* attrs). */
        & media-play-button {
          &[data-paused] .icon-pause,
          &:not([data-paused]) .icon-play {
            @apply hidden;
          }
        }

        & media-mute-button {
          & .icon-volume-high,
          & .icon-volume-low,
          & .icon-volume-off {
            @apply hidden;
          }

          &:is([data-volume-level='high'], [data-volume-level='medium']) .icon-volume-high,
          &[data-volume-level='low'] .icon-volume-low,
          &[data-volume-level='off'] .icon-volume-off {
            @apply inline-block;
          }
        }

        & media-fullscreen-button {
          &[data-fullscreen] .icon-fullscreen-enter,
          &:not([data-fullscreen]) .icon-fullscreen-exit {
            @apply hidden;
          }
        }

        & media-time-group {
          @apply cursor-default tabular-nums;
        }

        & .preview-media-player__slider {
          /* Margin, not padding: the thumb / preview offsets are % of this box, so it must match the track. */
          @apply relative flex flex-1 items-center min-w-24 mx-2.5 cursor-pointer touch-none outline-none;

          &.preview-media-player__slider--volume {
            @apply flex-none w-24 min-w-0;
          }

          & .preview-media-player__slider-track {
            @apply relative block w-full h-1 overflow-hidden rounded-full;

            background-color: var(--media-range-track-color);
          }

          & .preview-media-player__slider-buffer,
          & .preview-media-player__slider-fill {
            @apply absolute inset-y-0 left-0;
          }

          & .preview-media-player__slider-buffer {
            width: var(--media-slider-buffer, 0%);
            background-color: var(--media-range-buffer-color);
          }

          & .preview-media-player__slider-fill {
            width: var(--media-slider-fill, 0%);
            background-color: var(--media-control-color);
          }

          &[data-dragging] .preview-media-player__slider-fill {
            width: var(--media-slider-pointer, 0%);
          }

          & .preview-media-player__slider-thumb {
            @apply absolute top-1/2 size-2.5 -translate-1/2 rounded-full outline-none;

            left: var(--media-slider-fill, 0%);
            background-color: var(--media-control-color);

            &:focus-visible {
              box-shadow: 0 0 0 2px rgb(27 127 204 / 90%);
            }
          }

          &[data-dragging] .preview-media-player__slider-thumb {
            left: var(--media-slider-pointer, 0%);
          }

          & .preview-media-player__slider-preview {
            @apply absolute bottom-full mb-2 px-2 py-0.5 rounded-sm -translate-x-1/2
                   pointer-events-none tabular-nums opacity-0 transition-opacity;

            left: var(--media-slider-pointer, 0%);
            background-color: var(--media-control-background);
          }

          &:is([data-pointing], [data-dragging]) .preview-media-player__slider-preview {
            @apply opacity-100;
          }
        }

        & .preview-media-player__buffering {
          @apply absolute inset-0 hidden flex-row flex-nowrap justify-center items-center
                 bg-black/50 pointer-events-none;

          &[data-visible] {
            @apply flex;
          }

          & .preview-media-player__spinner {
            @apply size-14 animate-spin;
          }
        }

        /*
          Tooltips are native popovers inside the player, i.e. inside the
          preview <dialog>'s own subtree, so they paint over it without being
          inert. Undo the UA popover box; Video.js positions them itself.
        */
        & .preview-media-player__tooltip {
          @apply m-0 border-0 px-2 py-1 rounded-[5px] overflow-visible whitespace-nowrap pointer-events-none
                 text-[0.8125rem];

          --media-tooltip-side-offset: 0.5rem;
          color: var(--media-control-color);
          background-color: rgb(20 20 30 / 90%);

          &:not([data-open]) {
            @apply hidden;
          }

          /* Label only, like media-chrome's tooltips (shortcuts stay in aria-keyshortcuts). */
          & media-tooltip-shortcut {
            @apply hidden;
          }
        }
      }
    }
  }
}
</style>
