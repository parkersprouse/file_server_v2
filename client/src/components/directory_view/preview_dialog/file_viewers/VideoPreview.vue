<template>
  <video-player
    ref='player'
    class='preview-media-player preview-video-player'
  >
    <media-container
      ref='container'
      class='preview-media-player__container'
    >
      <!--
        `preload='metadata'` (not `auto`) keeps Firefox from eagerly streaming the
        file from byte 0 on open. That sequential download is what makes Firefox
        report a small, slowly-growing `seekable` range for videos whose MP4 `moov`
        index is not at the front of the file (i.e. not encoded "fast-start").
        Loading only metadata lets Firefox satisfy seeks with fresh range requests instead.
      -->
      <video
        ref='video_ele'
        class='preview-media-player__media'
        muted
        playsinline
        preload='metadata'
        :src='entry.url'
      />

      <media-poster
        v-if='entry.thumbnail'
        class='preview-video-player__poster'
      >
        <img
          alt=''
          decoding='async'
          :src='entry.thumbnail'
        >
      </media-poster>

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
        keys='f'
        action='toggleFullscreen'
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

      <!--
        A mouse click on the video toggles playback (as with media-chrome). A
        touch tap toggles the controls instead — the container does that by
        itself; `usePausedTouchToggle` extends it to paused playback.
      -->
      <media-gesture
        type='tap'
        action='togglePaused'
        pointer='mouse'
      />

      <media-buffering-indicator class='preview-media-player__buffering'>
        <ricon-loader-4-line class='preview-media-player__spinner' />
      </media-buffering-indicator>

      <media-controls class='preview-media-player__controls'>
        <media-controls-content class='preview-media-player__controls-content'>
          <media-controls-group
            v-if='$is_mobile'
            class='preview-video-player__centered'
            aria-label='Playback controls'
          >
            <!-- Bound, not plain attributes: Vue assigns these as (numeric) properties. -->
            <media-seek-button
              :seconds='-5'
              class='preview-media-player__control'
            >
              <ricon-replay-5-fill />
            </media-seek-button>
            <media-play-button class='preview-media-player__control'>
              <ricon-play-fill class='icon-play' />
              <ricon-pause-fill class='icon-pause' />
            </media-play-button>
            <media-seek-button
              :seconds='5'
              class='preview-media-player__control'
            >
              <ricon-forward-5-fill />
            </media-seek-button>
          </media-controls-group>

          <media-controls-group
            v-if='$is_mobile'
            class='preview-media-player__bar preview-video-player__bar--mobile'
            aria-label='Media controls'
          >
            <div class='preview-video-player__bar--mobile__top-bar'>
              <MediaTimeSlider />
            </div>

            <div class='preview-video-player__bar--mobile__bottom-bar'>
              <MediaMuteButton class='preview-media-player__control' />
              <MediaLoopButton
                class='preview-media-player__control'
                v-model:looping='looping'
              />
              <MediaTimeDisplay class='preview-media-player__control' />
              <media-fullscreen-button class='preview-media-player__control'>
                <ricon-fullscreen-fill class='icon-fullscreen-enter' />
                <ricon-fullscreen-exit-fill class='icon-fullscreen-exit' />
              </media-fullscreen-button>
            </div>
          </media-controls-group>

          <media-controls-group
            v-else
            class='preview-media-player__bar'
            aria-label='Media controls'
          >
            <media-tooltip-group>
              <media-play-button class='preview-media-player__control'>
                <ricon-play-fill class='icon-play' />
                <ricon-pause-fill class='icon-pause' />
              </media-play-button>
              <media-tooltip class='preview-media-player__tooltip' />

              <MediaTimeSlider />

              <MediaMuteButton class='preview-media-player__control' />
              <media-tooltip class='preview-media-player__tooltip' />

              <MediaLoopButton
                class='preview-media-player__control'
                v-model:looping='looping'
              />
              <media-tooltip class='preview-media-player__tooltip'>
                <media-tooltip-label>Loop</media-tooltip-label>
              </media-tooltip>

              <MediaTimeDisplay class='preview-media-player__control' />

              <media-fullscreen-button class='preview-media-player__control'>
                <ricon-fullscreen-fill class='icon-fullscreen-enter' />
                <ricon-fullscreen-exit-fill class='icon-fullscreen-exit' />
              </media-fullscreen-button>
              <media-tooltip class='preview-media-player__tooltip' />
            </media-tooltip-group>
          </media-controls-group>
        </media-controls-content>
      </media-controls>
    </media-container>
  </video-player>
</template>

<script setup lang='ts'>
import '@videojs/html/video/player';
import { useTemplateRef } from 'vue';

import { useIsMobile } from 'composables/is_mobile.ts';
import { useMediaLooping, useMediaPreferences, usePausedTouchToggle } from 'composables/media_player.ts';

import MediaLoopButton from './media_player/MediaLoopButton.vue';
import MediaMuteButton from './media_player/MediaMuteButton.vue';
import MediaTimeDisplay from './media_player/MediaTimeDisplay.vue';
import MediaTimeSlider from './media_player/MediaTimeSlider.vue';
import { SEEK_HOTKEYS } from './media_player/register.ts';

import type { VideoPlayerElement } from '@videojs/html/video';
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $is_mobile = useIsMobile();

const player = useTemplateRef<VideoPlayerElement>('player');
const container = useTemplateRef<HTMLElement>('container');
const video_ele = useTemplateRef<HTMLVideoElement>('video_ele');
const looping = useMediaLooping(video_ele);

// The video always opens muted, so it restores the saved volume but never
// writes preferences back (matching media-chrome's `muted`-attribute rules).
useMediaPreferences(player, { save: false });
usePausedTouchToggle(player, container);
</script>

<style>
@reference '../../../../assets/styles/index.css';

@layer app {
  .preview-dialog--video {
    & .preview-dialog__content {
      @apply h-full;

      & .preview-media-player__container {
        @apply w-[inherit] min-w-fit max-w-full h-full;

        /*
          media-chrome hid its chrome on idle even while paused (this app
          mirrored its playing-state rules for that). Video.js's `data-visible`
          stays on while paused by design, so the shared rules hide on
          `data-user-active` instead; here the idle cursor is hidden as well.
        */
        &:has(> media-controls:not([data-user-active])) {
          cursor: none;
        }

        &:fullscreen .preview-media-player__media {
          @apply h-full;
        }
      }

      & .preview-media-player__media {
        @apply object-contain object-center aspect-auto h-full w-full;
      }

      & .preview-video-player__poster {
        @apply absolute inset-0 pointer-events-none transition-opacity;

        &:not([data-visible]) {
          @apply opacity-0;
        }

        & img {
          @apply w-full h-full object-contain object-center;
        }
      }

      /*
        Mobile: big transport buttons centred over the video. The row spans the
        whole surface, so it must stay click-through (over the shared groups'
        `pointer-events: auto`): taps on the picture have to reach the video to
        toggle the controls, and swipes to page the gallery.
      */
      & .preview-video-player__centered {
        @apply absolute inset-0 flex flex-row flex-nowrap justify-evenly items-center w-full
               pointer-events-none! bg-transparent;

        & .preview-media-player__control {
          @apply pointer-events-auto bg-transparent;

          & svg {
            @apply size-12;
          }
        }
      }

      /* While buffering, the spinner takes the centre instead. */
      & .preview-media-player__container:has(media-buffering-indicator[data-visible]) .preview-video-player__centered {
        @apply hidden;
      }

      /* Doubled class to out-rank the shared single-row `.preview-media-player__bar`. */
      & .preview-media-player__bar.preview-video-player__bar--mobile {
        @apply flex flex-col flex-nowrap content-center justify-center;

        & .preview-video-player__bar--mobile__top-bar {
          @apply flex flex-row flex-nowrap content-center justify-stretch w-full p-0;
        }

        & .preview-video-player__bar--mobile__bottom-bar {
          @apply flex flex-row flex-nowrap content-center justify-between w-full p-0;

          & .preview-media-player__control {
            @apply flex-1;

            & svg {
              @apply size-7;
            }
          }
        }
      }
    }
  }
}
</style>
