<template>
  <media-controller
    breakpoints='sm:640 md:768 lg:1024 xl:1280'
    keyboardbackwardseekoffset='5'
    keyboardforwardseekoffset='5'
    audio
  >
    <audio
      slot='media'
      :src='entry.url'
    />
    <div slot='centered-chrome'>
      <media-seek-backward-button
        seekoffset='5'
        class='preview-audio-player__control'
      >
        <span slot='tooltip-content'>Back 5s</span>
        <ricon-replay-5-fill slot='icon' />
      </media-seek-backward-button>
      <media-play-button class='preview-audio-player__control'>
        <ricon-play-fill slot='play' />
        <ricon-pause-fill slot='pause' />
      </media-play-button>
      <media-seek-forward-button
        seekoffset='5'
        class='preview-audio-player__control'
      >
        <span slot='tooltip-content'>Forward 5s</span>
        <ricon-forward-5-fill slot='icon' />
      </media-seek-forward-button>
    </div>
    <media-control-bar>
      <media-play-button class='preview-audio-player__control'>
        <ricon-play-fill slot='play' />
        <ricon-pause-fill slot='pause' />
      </media-play-button>
      <media-seek-backward-button
        seekoffset='5'
        class='preview-audio-player__control'
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
        class='preview-audio-player__control'
      />
      <media-seek-forward-button
        seekoffset='5'
        class='preview-audio-player__control'
      >
        <span slot='tooltip-content'>Forward 5s</span>
        <ricon-forward-5-fill slot='icon' />
      </media-seek-forward-button>
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
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();
</script>

<style>
@reference '../../../../assets/styles/index.css';

@utility desktop-audio-player {
  [slot='centered-chrome'] {
    @apply hidden;
  }

  media-control-bar {
    media-seek-backward-button,
    media-play-button,
    media-seek-forward-button,
    media-mute-button,
    media-volume-range {
      @apply inline-flex;
    }
  }
}

@utility mobile-audio-player {
  [slot='centered-chrome'] {
    @apply flex;
  }

  media-control-bar {
    media-seek-backward-button,
    media-play-button,
    media-seek-forward-button,
    media-mute-button,
    media-volume-range {
      @apply hidden;
    }
  }
}

@layer app {
  .preview-dialog--audio {
    & .preview-dialog__content {
      @apply container;

      & media-controller {
        @apply w-full h-full border border-zinc-700/85 dark:border-zinc-800 mobile-audio-player;

        & [slot='media'] {
          @apply w-full h-full inline-block!;
        }

        &[breakpointsm] {
          @apply mobile-audio-player;
        }

        &[breakpointmd] {
          @apply desktop-audio-player;
        }

        &[breakpointlg] {
          @apply desktop-audio-player;
        }

        &[breakpointxl] {
          @apply desktop-audio-player;
        }

        & [slot='centered-chrome'] {
          @apply flex flex-row flex-nowrap justify-evenly items-center;
          background-color: var(--media-control-background);

          & .preview-audio-player__control {
            @apply not-hover:bg-transparent flex-1;

            & svg {
              @apply size-12!;
            }
          }
        }
      }
    }
  }
}
</style>
