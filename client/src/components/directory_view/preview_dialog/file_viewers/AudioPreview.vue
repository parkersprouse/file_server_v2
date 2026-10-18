<template>
  <!--
    Video.js's Neutral audio skin, from its shadcn registry source (installed
    under `components/videojs`; see CLAUDE.md and VideoPreview.vue for the
    general rules). App changes to the registry's `audio/skin.html`: a
    two-row layout (timeline with the time at either end, then loop + speed |
    seek, a larger play, seek | volume, inline as a slider when the player is
    wide), a Loop switch, per-instance ids, props bound as values, and the
    speed menu's item `<template>` injected with `v-html`.
  -->
  <audio-player
    ref='player'
    class='preview-audio-player'
  >
    <media-container
      ref='container'
      class='media-skin media-container audio-skin preview-audio-skin'
      data-theme='neutral'
      data-preset='audio'
    >
      <audio
        ref='audio_ele'
        :src='entry.url'
      />

      <media-error-dialog class='audio-dialog-root'>
        <media-dialog-backdrop class='audio-dialog-backdrop' />
        <media-dialog-popup class='audio-dialog-popup'>
          <div class='audio-dialog-content'>
            <media-dialog-title class='audio-dialog-title' />
            <media-dialog-description class='audio-dialog-description' />
          </div>
          <div class='audio-dialog-actions'>
            <media-dialog-close class='media-button audio-dialog-close' />
          </div>
        </media-dialog-popup>
      </media-error-dialog>

      <!-- Audio has nothing to reveal on idle, so its controls never hide. -->
      <media-controls visibility='always'>
        <media-controls-content class='audio-controls audio-controls-content preview-audio-controls'>
          <media-tooltip-group class='preview-audio-controls__rows'>
            <!-- Row 1: current time, the timeline, duration. -->
            <media-controls-group class='preview-audio-timeline'>
              <media-time
                class='media-time-toggle preview-audio-timeline__time'
                type='current'
                :toggle='true'
              />
              <media-time-slider class='media-slider audio-time-slider'>
                <media-slider-track class='media-slider-track'>
                  <media-slider-buffer class='media-slider-buffer' />
                  <media-slider-fill class='media-slider-fill' />
                </media-slider-track>
                <media-slider-thumb class='media-slider-thumb audio-time-slider-thumb' />
                <media-slider-preview
                  class='media-slider-preview'
                  overflow='clamp'
                >
                  <div
                    class='media-slider-preview-content media-popup-surface media-tooltip
                           audio-time-slider-preview-content'
                  >
                    <media-slider-value
                      class='audio-time-slider-value'
                      type='pointer'
                    />
                  </div>
                </media-slider-preview>
              </media-time-slider>
              <media-time
                class='media-time-duration-value preview-audio-timeline__time'
                type='duration'
              />
            </media-controls-group>

            <!-- Row 2: loop + speed | seek, play, seek | volume. -->
            <div class='preview-audio-transport'>
              <media-controls-group class='preview-audio-transport__start'>
                <MediaLoopButton
                  :id='ids.loop'
                  v-model:looping='looping'
                  class='media-button preview-media-loop-button'
                />
                <media-tooltip
                  :trigger='ids.loop'
                  boundary='viewport'
                  side='top'
                  class='media-popup media-popup-safe-area media-popup-transition media-popup-surface media-tooltip'
                >
                  <media-tooltip-label>{{ looping ? 'Disable loop' : 'Loop' }}</media-tooltip-label>
                </media-tooltip>

                <media-playback-rate-button
                  :id='ids.rate'
                  :commandfor='ids.rate_menu'
                  class='media-button media-playback-rate-button'
                />
                <media-tooltip
                  :trigger='ids.rate'
                  boundary='viewport'
                  side='top'
                  class='media-popup media-popup-safe-area media-popup-transition media-popup-surface media-tooltip'
                >
                  <media-tooltip-label />
                  <media-tooltip-shortcut class='media-tooltip-shortcut' />
                </media-tooltip>
                <media-menu
                  :id='ids.rate_menu'
                  side='top'
                  align='center'
                  boundary='viewport'
                  class='media-popup media-popup-surface media-menu-popup audio-settings-menu-popup'
                >
                  <media-menu-content class='media-menu-content'>
                    <!-- eslint-disable vue/no-v-text-v-html-on-component -- custom element, static markup -->
                    <media-playback-rate-radio-group
                      class='media-menu-radio-group'
                      v-html='RATE_ITEM_TEMPLATE'
                    />
                    <!-- eslint-enable vue/no-v-text-v-html-on-component -->
                  </media-menu-content>
                </media-menu>
              </media-controls-group>

              <media-controls-group class='preview-audio-transport__centre'>
                <MediaSeekControl
                  :id='`${ids.seek}-back`'
                  :seconds='-SEEK_SECONDS'
                />
                <div
                  class='audio-play-button preview-audio-play'
                >
                  <media-buffering-indicator class='media-buffering-indicator audio-play-button-buffering-indicator'>
                    <media-icon
                      family='neutral'
                      name='spinner'
                      class='media-buffering-indicator-spinner-icon'
                    />
                  </media-buffering-indicator>
                  <media-play-button
                    :id='ids.play'
                    class='media-button media-play-button'
                  >
                    <media-icon
                      family='neutral'
                      name='restart'
                      class='media-button-icon media-play-button-restart-icon'
                    />
                    <media-icon
                      family='neutral'
                      name='play'
                      class='media-button-icon media-play-button-play-icon'
                    />
                    <media-icon
                      family='neutral'
                      name='pause'
                      class='media-button-icon media-play-button-pause-icon'
                    />
                  </media-play-button>
                  <media-tooltip
                    :trigger='ids.play'
                    boundary='viewport'
                    side='top'
                    class='media-popup media-popup-safe-area media-popup-transition media-popup-surface media-tooltip'
                  >
                    <media-tooltip-label />
                    <media-tooltip-shortcut class='media-tooltip-shortcut' />
                  </media-tooltip>
                </div>
                <MediaSeekControl
                  :id='`${ids.seek}-forward`'
                  :seconds='SEEK_SECONDS'
                />
              </media-controls-group>

              <media-controls-group class='preview-audio-transport__end'>
                <media-mute-button
                  :id='ids.mute'
                  :commandfor='narrow ? ids.volume : undefined'
                  class='media-button media-mute-button'
                >
                  <media-icon
                    family='neutral'
                    name='volume-off'
                    class='media-button-icon media-mute-button-off-icon'
                  />
                  <media-icon
                    family='neutral'
                    name='volume-low'
                    class='media-button-icon media-mute-button-low-icon'
                  />
                  <media-icon
                    family='neutral'
                    name='volume-high'
                    class='media-button-icon media-mute-button-high-icon'
                  />
                </media-mute-button>
                <media-tooltip
                  :trigger='ids.mute'
                  :delay='0'
                  :sticky='true'
                  side='top'
                  class='media-popup media-popup-safe-area media-popup-transition media-popup-surface media-tooltip'
                >
                  <media-tooltip-label />
                  <media-tooltip-shortcut class='media-tooltip-shortcut' />
                </media-tooltip>
                <!-- Wide players have room for the volume slider inline; narrow ones pop it over on hover. -->
                <media-volume-popover
                  v-if='narrow'
                  :id='ids.volume'
                  :open-on-hover='true'
                  :delay='200'
                  :close-delay='100'
                  side='left'
                  boundary='viewport'
                  class='media-popup media-popup-safe-area
                         media-popup-transition media-popup-surface media-volume-popover'
                >
                  <media-volume-slider
                    class='media-slider media-volume-slider'
                    thumb-alignment='edge'
                    orientation='horizontal'
                  >
                    <media-slider-track class='media-slider-track'>
                      <media-slider-fill class='media-slider-fill' />
                    </media-slider-track>
                    <media-slider-thumb class='media-slider-thumb media-volume-slider-thumb' />
                  </media-volume-slider>
                </media-volume-popover>
                <media-volume-slider
                  v-else
                  class='media-slider media-volume-slider preview-audio-volume'
                  thumb-alignment='edge'
                  orientation='horizontal'
                >
                  <media-slider-track class='media-slider-track'>
                    <media-slider-fill class='media-slider-fill' />
                  </media-slider-track>
                  <media-slider-thumb class='media-slider-thumb media-volume-slider-thumb' />
                </media-volume-slider>
              </media-controls-group>
            </div>
          </media-tooltip-group>
        </media-controls-content>
      </media-controls>

      <media-hotkey
        v-for='hotkey in MEDIA_HOTKEYS'
        :key='hotkey.keys'
        :keys='hotkey.keys'
        :action='hotkey.action'
        :value='hotkey.value'
      />

      <media-status-announcer class='media-status-announcer' />
    </media-container>
  </audio-player>
</template>

<script setup lang='ts'>
import '@videojs/html/audio/player';
import { useElementSize } from '@vueuse/core';
import { computed, useId, useTemplateRef } from 'vue';

import 'components/videojs/audio/skin.ts';
import { useMediaLooping, useMediaPreferences } from 'composables/media_player.ts';

import { MEDIA_HOTKEYS } from './media_player/hotkeys.ts';
import MediaLoopButton from './media_player/MediaLoopButton.vue';
import MediaSeekControl from './media_player/MediaSeekControl.vue';

import type { AudioPlayerElement } from '@videojs/html/audio';
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const RATE_ITEM_TEMPLATE = `<template>
  <media-menu-radio-item class="media-menu-radio-item">
    <span data-part="label"></span>
    <media-menu-item-indicator force-mount class="media-menu-item-indicator">
      <media-icon family="neutral" name="check" class="media-menu-radio-item-icon"></media-icon>
    </media-menu-item-indicator>
  </media-menu-radio-item>
</template>`;

// The skin's 10 s seek step.
const SEEK_SECONDS = 10;

// `trigger` / `commandfor` pair elements by id, so ids must be unique per player.
const uid = useId();
const ids = {
  loop: `${uid}-loop`,
  mute: `${uid}-mute`,
  play: `${uid}-play`,
  rate: `${uid}-rate`,
  rate_menu: `${uid}-rate-menu`,
  seek: `${uid}-seek`,
  volume: `${uid}-volume`,
};

const player = useTemplateRef<AudioPlayerElement>('player');
const audio_ele = useTemplateRef<HTMLAudioElement>('audio_ele');
const looping = useMediaLooping(audio_ele);

// The skin's own wide breakpoint (`@container media-root (width >= 42rem)`),
// which switches the hover volume popover for an inline slider.
const NARROW_REM = 42;
const root_font_px = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
const container = useTemplateRef<HTMLElement>('container');
const { width: container_width } = useElementSize(container);
const narrow = computed<boolean>(() => container_width.value < NARROW_REM * root_font_px);

useMediaPreferences(player, { save: true });
</script>

<style>
@reference '../../../../assets/styles/index.css';

@layer app {
  .preview-dialog--audio .preview-dialog__content {
    @apply container;
  }

  .preview-audio-player {
    @apply block w-full;
  }

  /*
    The audio skin themes itself with `light-dark()`, which follows the
    inherited `color-scheme`; the app's theme toggle only flips the `.dark`
    class, so mirror it here.
  */
  .preview-audio-skin {
    /*
      Square corners, as the pre-Video.js player had (Neutral rounds the
      container 12px and the controls bar 14px).
    */
    --media-border-radius: 0;
    --media-controls-radius: 0;

    @apply w-full scheme-light dark:scheme-dark;
  }

  /*
    Layout A: the timeline gets its own full-width row with the times at either
    end, and the buttons a row below in three clusters (loop + speed, the
    transport centred around a larger play button, volume). The skin's single
    flex row is replaced, so its groups' classes aren't used here.
  */
  /*
    A real border in the app's muted border colour, in place of the skin's
    1px `box-shadow` ring, which the app's global hover / focus reset
    (`box-shadow: none !important`) strips while the player is in use.
  */
  .preview-audio-controls {
    @apply block border border-border;

    padding: calc(var(--media-spacing) * 2) calc(var(--media-spacing) * 3);
    box-shadow: none;
  }

  .preview-audio-controls__rows {
    @apply flex flex-col;

    gap: var(--media-spacing);
  }

  .preview-audio-timeline {
    @apply flex items-center;

    gap: calc(var(--media-spacing) * 3);
    padding-inline: var(--media-spacing);
  }

  /* The skin hides the duration on narrow players; here it has a slot. */
  .preview-audio-timeline .media-time-duration-value {
    @apply inline;
  }

  .preview-audio-timeline__time {
    @apply shrink-0 text-sm;
  }

  .preview-audio-transport {
    @apply grid items-center;

    grid-template-columns: 1fr auto 1fr;
  }

  .preview-audio-transport__start,
  .preview-audio-transport__centre,
  .preview-audio-transport__end {
    @apply flex items-center;

    gap: var(--media-spacing);
  }

  .preview-audio-transport__centre {
    gap: calc(var(--media-spacing) * 3);
  }

  .preview-audio-transport__end {
    @apply justify-end;
  }

  /* The larger, filled play button anchoring the transport. */
  .preview-audio-play {
    --media-control-size: calc(var(--media-spacing) * 12);
    --media-icon-size: calc(var(--media-spacing) * 6);

    & .media-play-button,
    & .audio-play-button-buffering-indicator {
      @apply rounded-full;
    }

    & .media-play-button {
      color: var(--media-controls);
      background-color: var(--media-controls-foreground);
    }
  }

  .preview-audio-volume {
    flex: 0 1 calc(var(--media-spacing) * 24);
    min-width: calc(var(--media-spacing) * 12);
    margin-inline-end: var(--media-spacing);
  }

  /* Wide players (the skin's 42rem breakpoint): bigger targets and spacing. */
  @container media-root (width >= 42rem) {
    .preview-audio-controls {
      --media-control-size: calc(var(--media-spacing) * 11);
      --media-icon-size: calc(var(--media-spacing) * 5.5);

      padding: calc(var(--media-spacing) * 3) calc(var(--media-spacing) * 5);
    }

    .preview-audio-controls__rows {
      gap: calc(var(--media-spacing) * 2);
    }

    .preview-audio-timeline__time {
      @apply text-base;
    }

    .preview-audio-play {
      --media-control-size: calc(var(--media-spacing) * 14);
      --media-icon-size: calc(var(--media-spacing) * 7);
    }
  }
}
</style>
