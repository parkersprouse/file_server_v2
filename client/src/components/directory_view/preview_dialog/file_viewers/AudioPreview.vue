<template>
  <media-controller
    ref='media_controller'
    audio
    keyboardbackwardseekoffset='5'
    keyboardforwardseekoffset='5'
  >
    <audio
      ref='audio_ele'
      slot='media'
      :src='entry.url'
    />

    <div slot='centered-chrome'>
      <media-seek-backward-button
        seekoffset='5'
        class='preview-audio-player__control'
      >
        <ricon-replay-5-fill slot='icon' />
      </media-seek-backward-button>
      <media-loop-toggle-button class='preview-audio-player__control ' />
      <media-play-button class='preview-audio-player__control'>
        <ricon-play-fill slot='play' />
        <ricon-pause-fill slot='pause' />
      </media-play-button>
      <media-mute-button class='preview-audio-player__control'>
        <ricon-volume-up-fill slot='high' />
        <ricon-volume-up-fill slot='medium' />
        <ricon-volume-down-fill slot='low' />
        <ricon-volume-mute-fill slot='off' />
      </media-mute-button>
      <media-seek-forward-button
        seekoffset='5'
        class='preview-audio-player__control'
      >
        <ricon-forward-5-fill slot='icon' />
      </media-seek-forward-button>
    </div>

    <media-control-bar>
      <media-play-button class='preview-audio-player__control'>
        <ricon-play-fill slot='play' />
        <ricon-pause-fill slot='pause' />
      </media-play-button>
      <media-time-range>
        <div
          slot='current'
          part='arrow'
        />
      </media-time-range>
      <media-time-display
        showduration
        class='preview-audio-player__control'
      />
      <media-loop-toggle-button class='preview-audio-player__control' />
      <media-mute-button class='preview-audio-player__control'>
        <ricon-volume-up-fill slot='high' />
        <ricon-volume-up-fill slot='medium' />
        <ricon-volume-down-fill slot='low' />
        <ricon-volume-mute-fill slot='off' />
      </media-mute-button>
      <media-volume-range class='preview-audio-player__control' />
    </media-control-bar>

  </media-controller>
</template>

<script setup lang='ts'>
import { get, useEventListener } from '@vueuse/core';
import 'media-chrome';
import { useTemplateRef } from 'vue';

import MediaLoopToggleButton from './video_preview/media_loop_button.ts';

import type { MediaController } from 'media-chrome';
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const audio_ele = useTemplateRef<HTMLAudioElement>('audio_ele');
const media_controller = useTemplateRef<MediaController>('media_controller');

function toggleLooping(event: Event): void {
  const ele = get(audio_ele);
  if (!ele) return;
  const toggle_button = event.target as MediaLoopToggleButton;
  ele.loop = toggle_button.mediaLooping;
}

useEventListener(media_controller, MediaLoopToggleButton.EVENT_NAME, toggleLooping);
</script>

<style>
@reference '../../../../assets/styles/index.css';

@utility desktop-audio-player {
  [slot='centered-chrome'] {
    @apply hidden;
  }

  media-control-bar {
    & .preview-audio-player__control {
      display: var(--media-control-display, inline-flex);
      flex-flow: row nowrap;
    }
  }
}

@utility mobile-audio-player {
  [slot='centered-chrome'] {
    --media-button-icon-width: 2.5rem;
    --media-button-icon-height: 2.5rem;

    @apply flex flex-row flex-nowrap justify-evenly items-stretch w-full;
    background-color: var(--media-control-background);

    & .preview-audio-player__control {
      @apply not-hover:bg-transparent flex-1;
    }

    & media-loop-toggle-button {
      --media-button-icon-width: 2rem;
      --media-button-icon-height: 2rem;
    }
  }

  media-control-bar {
    media-seek-backward-button,
    media-play-button,
    media-seek-forward-button,
    media-mute-button,
    media-volume-range,
    media-loop-toggle-button {
      @apply hidden;
    }
  }
}

@layer app {
  .preview-dialog--audio {
    & .preview-dialog__content {
      @apply container;

      & media-controller {
        @apply w-full h-full border border-zinc-700/85 dark:border-zinc-800
               mobile-audio-player md:desktop-audio-player;

        & [slot='media'] {
          @apply w-full h-full inline-block!;
        }
      }
    }
  }
}
</style>
