<template>
  <media-controller
    autohide='2'
    autohideovercontrols
    keyboardbackwardseekoffset='5'
    keyboardforwardseekoffset='5'
  >
    <video
      slot='media'
      :src='entry.url'
      muted
    />

    <media-loading-indicator slot='centered-chrome' />
    <div
      slot='centered-chrome'
      class='mobile-controls'
    >
      <media-seek-backward-button
        notooltip
        seekoffset='5'
        class='preview-video-player__control'
      >
        <ricon-replay-5-fill slot='icon' />
      </media-seek-backward-button>
      <media-play-button
        notooltip
        class='preview-video-player__control'
      >
        <ricon-play-fill slot='play' />
        <ricon-pause-fill slot='pause' />
      </media-play-button>
      <media-seek-forward-button
        notooltip
        seekoffset='5'
        class='preview-video-player__control'
      >
        <ricon-forward-5-fill slot='icon' />
      </media-seek-forward-button>
    </div>

    <media-control-bar>
      <media-play-button class='preview-video-player__control'>
        <ricon-play-fill slot='play' />
        <ricon-pause-fill slot='pause' />
      </media-play-button>
      <media-mute-button class='preview-video-player__control'>
        <ricon-volume-up-fill slot='high' />
        <ricon-volume-up-fill slot='medium' />
        <ricon-volume-down-fill slot='low' />
        <ricon-volume-mute-fill slot='off' />
      </media-mute-button>
      <media-seek-backward-button
        seekoffset='5'
        class='preview-video-player__control'
      >
        <span slot='tooltip-content'>Back 5s</span>
        <ricon-replay-5-fill slot='icon' />
      </media-seek-backward-button>
      <media-time-range>
        <div
          slot='current'
          part='arrow'
        />
      </media-time-range>
      <media-time-display
        showduration
        class='preview-video-player__control'
      />
      <media-seek-forward-button
        seekoffset='5'
        class='preview-video-player__control'
      >
        <span slot='tooltip-content'>Forward 5s</span>
        <ricon-forward-5-fill slot='icon' />
      </media-seek-forward-button>
      <media-fullscreen-button class='preview-video-player__control'>
        <span slot='tooltip-enter'>Fullscreen</span>
        <span slot='tooltip-exit'>Leave Fullscreen</span>
        <ricon-fullscreen-fill slot='enter' />
        <ricon-fullscreen-exit-fill slot='exit' />
      </media-fullscreen-button>
    </media-control-bar>
  </media-controller>
</template>

<script setup lang='ts'>
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();
</script>

<style>
@reference '../../../../assets/styles/index.css';

@utility desktop-video-player {
  .mobile-controls[slot='centered-chrome'] {
    @apply hidden;
  }

  media-control-bar {
    & .preview-video-player__control {
      display: var(--media-control-display, inline-flex);
      flex-flow: row nowrap;
    }
  }
}

@utility mobile-video-player {
  .mobile-controls[slot='centered-chrome'] {
    @apply flex flex-row flex-nowrap justify-evenly items-center w-full;
    background-color: transparent;

    & .preview-video-player__control {
      @apply bg-transparent;

      & svg {
        @apply size-12!;
      }
    }
  }

  media-control-bar {
    media-seek-backward-button,
    media-play-button,
    media-seek-forward-button,
    media-mute-button {
      @apply hidden;
    }
  }
}

@layer app {
  .preview-dialog--video {
    & .preview-dialog__content {
      & media-controller {
        @apply w-auto h-auto mobile-video-player md:desktop-video-player;

        & [slot='media'] {
          @apply object-contain aspect-auto;
        }

        & media-loading-indicator[slot='centered-chrome'] {
          --media-loading-indicator-transition-delay: 500ms;

          @apply hidden w-full h-full;
        }

        &[medialoading]:not([mediapaused]) {
          & media-loading-indicator[slot='centered-chrome'] {
            --media-loading-indicator-opacity: 1;

            @apply flex flex-row flex-nowrap justify-center items-center bg-black/50;
          }

          & .mobile-controls[slot='centered-chrome'] {
            @apply hidden;
          }
        }
      }
    }
  }
}
</style>
