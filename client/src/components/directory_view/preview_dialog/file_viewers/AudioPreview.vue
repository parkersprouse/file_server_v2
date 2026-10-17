<template>
  <!--
    Video.js's Neutral audio skin, from its shadcn registry source (installed
    under `components/videojs`; see CLAUDE.md and VideoPreview.vue for the
    general rules). App changes to the registry's `audio/skin.html`: a Loop
    switch before the mute button, per-instance ids, props bound as values,
    and the speed menu's item `<template>` injected with `v-html`.
  -->
  <audio-player
    ref='player'
    class='preview-audio-player'
  >
    <media-container
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
        <media-controls-content class='audio-controls audio-controls-content'>
          <media-tooltip-group>
            <media-controls-group class='audio-controls-start'>
              <div class='audio-play-button'>
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

              <template
                v-for='seek in SEEK_BUTTONS'
                :key='seek.seconds'
              >
                <media-seek-button
                  :id='`${ids.seek}${seek.seconds}`'
                  :seconds='seek.seconds'
                  class='media-button media-seek-button'
                >
                  <div class='media-seek-button-content'>
                    <media-icon
                      family='neutral'
                      name='seek'
                      :class='seek.icon_class'
                    />
                    <span :class='seek.label_class'>{{ Math.abs(seek.seconds) }}</span>
                  </div>
                </media-seek-button>
                <media-tooltip
                  :trigger='`${ids.seek}${seek.seconds}`'
                  boundary='viewport'
                  side='top'
                  class='media-popup media-popup-safe-area media-popup-transition media-popup-surface media-tooltip'
                >
                  <media-tooltip-label />
                  <media-tooltip-shortcut class='media-tooltip-shortcut' />
                </media-tooltip>
              </template>
            </media-controls-group>

            <media-controls-group class='audio-time-slider-group'>
              <media-time-group class='media-time-group'>
                <media-time
                  class='media-time-toggle'
                  type='current'
                  :toggle='true'
                />
                <media-time-separator class='media-time-separator' />
                <media-time
                  class='media-time-duration-value'
                  type='duration'
                />
              </media-time-group>
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
            </media-controls-group>

            <media-controls-group class='audio-controls-end'>
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

              <media-mute-button
                :id='ids.mute'
                :commandfor='ids.volume'
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
              <media-volume-popover
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
import { useId, useTemplateRef } from 'vue';

import 'components/videojs/audio/skin.ts';
import { useMediaLooping, useMediaPreferences } from 'composables/media_player.ts';

import { MEDIA_HOTKEYS } from './media_player/hotkeys.ts';
import MediaLoopButton from './media_player/MediaLoopButton.vue';

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

const SEEK_BUTTONS = [
  {
    icon_class: 'media-button-icon media-seek-button-backward-icon',
    label_class: 'media-seek-button-label media-seek-button-backward-label',
    seconds: -10,
  },
  {
    icon_class: 'media-button-icon',
    label_class: 'media-seek-button-label media-seek-button-forward-label',
    seconds: 10,
  },
] as const;

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
    /* Square corners, as the pre-Video.js player had (Neutral rounds 12px). */
    --media-border-radius: 0;

    @apply w-full scheme-light dark:scheme-dark;
  }
}
</style>
