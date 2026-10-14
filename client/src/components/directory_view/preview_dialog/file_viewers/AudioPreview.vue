<template>
  <audio-player
    ref='player'
    class='preview-media-player preview-audio-player'
  >
    <media-container class='preview-media-player__container'>
      <audio
        ref='audio_ele'
        class='preview-media-player__media'
        :src='entry.url'
      />

      <!-- media-chrome's default shortcut set, with its 5s keyboard seek offset. -->
      <media-hotkey
        keys='Space'
        action='togglePaused'
      />
      <media-hotkey
        keys='k'
        action='togglePaused'
      />
      <media-hotkey
        keys='m'
        action='toggleMuted'
      />
      <media-hotkey
        v-for='hotkey in SEEK_HOTKEYS'
        :key='hotkey.keys'
        action='seekStep'
        :keys='hotkey.keys'
        :value='hotkey.value'
      />
      <media-hotkey
        keys='ArrowUp'
        action='volumeStep'
      />
      <media-hotkey
        keys='ArrowDown'
        action='volumeStep'
      />
      <media-hotkey
        keys='<'
        action='speedDown'
      />
      <media-hotkey
        keys='>'
        action='speedUp'
      />

      <!-- Audio has nothing to reveal on idle, so its controls never hide. -->
      <media-controls
        class='preview-media-player__controls'
        visibility='always'
      >
        <media-controls-content class='preview-media-player__controls-content'>
          <!-- Mobile only: a row of large transport buttons above the bar. -->
          <media-controls-group
            class='preview-audio-player__transport'
            aria-label='Playback controls'
          >
            <media-seek-button
              :seconds='-5'
              class='preview-media-player__control'
            >
              <ricon-replay-5-fill />
            </media-seek-button>
            <MediaLoopButton
              class='preview-media-player__control preview-audio-player__loop'
              v-model:looping='looping'
            />
            <media-play-button class='preview-media-player__control'>
              <ricon-play-fill class='icon-play' />
              <ricon-pause-fill class='icon-pause' />
            </media-play-button>
            <MediaMuteButton class='preview-media-player__control' />
            <media-seek-button
              :seconds='5'
              class='preview-media-player__control'
            >
              <ricon-forward-5-fill />
            </media-seek-button>
          </media-controls-group>

          <media-controls-group
            class='preview-media-player__bar'
            aria-label='Media controls'
          >
            <media-tooltip-group>
              <media-play-button class='preview-media-player__control preview-audio-player__desktop-only'>
                <ricon-play-fill class='icon-play' />
                <ricon-pause-fill class='icon-pause' />
              </media-play-button>
              <media-tooltip class='preview-media-player__tooltip' />

              <MediaTimeSlider />
              <MediaTimeDisplay class='preview-media-player__control' />

              <MediaLoopButton
                class='preview-media-player__control preview-audio-player__desktop-only'
                v-model:looping='looping'
              />
              <media-tooltip class='preview-media-player__tooltip'>
                <media-tooltip-label>Loop</media-tooltip-label>
              </media-tooltip>

              <MediaMuteButton class='preview-media-player__control preview-audio-player__desktop-only' />
              <media-tooltip class='preview-media-player__tooltip' />

              <MediaVolumeSlider class='preview-audio-player__desktop-only' />
            </media-tooltip-group>
          </media-controls-group>
        </media-controls-content>
      </media-controls>
    </media-container>
  </audio-player>
</template>

<script setup lang='ts'>
import '@videojs/html/audio/player';
import { useTemplateRef } from 'vue';

import { useMediaLooping, useMediaPreferences } from 'composables/media_player.ts';

import MediaLoopButton from './media_player/MediaLoopButton.vue';
import MediaMuteButton from './media_player/MediaMuteButton.vue';
import MediaTimeDisplay from './media_player/MediaTimeDisplay.vue';
import MediaTimeSlider from './media_player/MediaTimeSlider.vue';
import MediaVolumeSlider from './media_player/MediaVolumeSlider.vue';
import { SEEK_HOTKEYS } from './media_player/register.ts';

import type { AudioPlayerElement } from '@videojs/html/audio';
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const player = useTemplateRef<AudioPlayerElement>('player');
const audio_ele = useTemplateRef<HTMLAudioElement>('audio_ele');
const looping = useMediaLooping(audio_ele);

useMediaPreferences(player, { save: true });
</script>

<style>
@reference '../../../../assets/styles/index.css';

@utility desktop-audio-player {
  & .preview-audio-player__transport {
    @apply hidden;
  }
}

@utility mobile-audio-player {
  & .preview-audio-player__transport {
    @apply flex flex-row flex-nowrap justify-evenly items-stretch w-full;
    background-color: var(--media-control-background);

    & .preview-media-player__control {
      @apply flex-1 not-hover:bg-transparent;

      & svg {
        @apply size-10;
      }
    }

    & .preview-audio-player__loop svg {
      @apply size-8;
    }
  }

  & .preview-audio-player__desktop-only {
    @apply hidden;
  }
}

@layer app {
  .preview-dialog--audio {
    & .preview-dialog__content {
      @apply container;

      & .preview-media-player__container {
        @apply w-full h-full border border-zinc-700/85 dark:border-zinc-800
               max-md:mobile-audio-player md:desktop-audio-player;
      }
    }
  }
}
</style>
