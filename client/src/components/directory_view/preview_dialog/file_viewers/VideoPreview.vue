<template>
  <!--
    Video.js's Neutral video skin, from its shadcn registry source (installed
    under `components/videojs`; see CLAUDE.md). The markup mirrors the
    registry's `video/skin.html` with these app changes:
      • no captions (button, settings submenu, `c` hotkey, status icons) — the
        files served here never carry text tracks;
      • a Loop switch in the trailing group (Video.js has no loop control);
      • a mobile layout below the skin's 42rem breakpoint: a centre play
        button (also shown for coarse pointers), and Loop / picture-in-picture
        moved from the bar into the Settings menu so the buttons fit one row;
      • no touch `toggleControls` or double-tap fullscreen gesture (see the
        note by the gestures);
      • per-instance ids, and numeric/boolean props bound as values (Vue
        assigns known custom-element props as properties, so a plain
        `seconds='5'` would arrive as the string '5');
      • the `<template>`s Video.js clones are injected with `v-html`, since a
        Vue-rendered `<template>` puts its children outside `.content`.
  -->
  <video-player
    ref='player'
    class='preview-video-player'
    :style='{ "--preview-video-aspect": aspect_ratio }'
  >
    <media-container
      ref='container'
      class='media-skin media-container video-skin preview-video-skin'
      data-theme='neutral'
      data-preset='video'
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
        muted
        playsinline
        preload='metadata'
        :src='entry.url'
        @loadedmetadata='onLoadedMetadata'
      />

      <media-poster
        v-if='entry.thumbnail'
        class='media-poster'
      >
        <img
          alt=''
          decoding='async'
          class='media-poster-image'
          :src='entry.thumbnail'
        >
      </media-poster>

      <media-buffering-indicator class='media-buffering-indicator'>
        <media-icon
          family='neutral'
          name='spinner'
          class='media-buffering-indicator-spinner-icon'
        />
      </media-buffering-indicator>

      <media-error-dialog class='media-dialog-root'>
        <media-dialog-backdrop class='media-dialog-backdrop' />
        <media-dialog-popup class='media-dialog-popup'>
          <div class='media-dialog-content'>
            <media-dialog-title class='media-dialog-title' />
            <media-dialog-description class='media-dialog-description' />
          </div>
          <div class='media-dialog-actions'>
            <media-dialog-close class='media-button media-dialog-close' />
          </div>
        </media-dialog-popup>
      </media-error-dialog>

      <media-title class='media-title' />

      <media-controls>
        <media-controls-backdrop class='video-controls-backdrop' />
        <!-- Big tap target for narrow / touch players; hidden otherwise by CSS. -->
        <media-play-button class='media-button media-play-button preview-video-centre-play'>
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
        <media-controls-content class='video-controls video-controls-content video-controls-wrap'>
          <media-tooltip-group>
            <media-controls-group class='video-controls-start'>
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
                side='top'
                class='media-popup media-popup-safe-area media-popup-transition media-popup-surface media-tooltip'
              >
                <media-tooltip-label />
                <media-tooltip-shortcut class='media-tooltip-shortcut' />
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
                side='right'
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
            </media-controls-group>

            <media-controls-group class='video-time-slider-group'>
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
              <media-time-slider class='media-slider media-time-slider'>
                <!-- eslint-disable vue/no-v-text-v-html-on-component -- custom element, static markup -->
                <media-time-slider-chapters
                  class='media-time-slider-chapters'
                  v-html='CHAPTER_TEMPLATE'
                />
                <!-- eslint-enable vue/no-v-text-v-html-on-component -->
                <media-slider-thumb class='media-slider-thumb media-time-slider-thumb' />
                <media-slider-preview
                  class='media-slider-preview'
                  overflow='clamp'
                >
                  <media-slider-thumbnail
                    class='media-slider-preview-content media-popup-surface media-slider-thumbnail'
                  >
                    <img
                      alt=''
                      aria-hidden='true'
                      decoding='async'
                      class='media-slider-thumbnail-image'
                    >
                    <media-icon
                      family='neutral'
                      name='spinner'
                      class='media-slider-thumbnail-spinner-icon'
                    />
                  </media-slider-thumbnail>
                  <div class='media-slider-preview-content media-time-slider-preview-content'>
                    <media-time-slider-chapter-title class='media-time-slider-chapter-title' />
                    <media-slider-value
                      class='media-time-slider-value'
                      type='pointer'
                    />
                  </div>
                </media-slider-preview>
              </media-time-slider>
            </media-controls-group>

            <media-controls-group class='video-controls-end'>
              <template v-if='!narrow'>
                <MediaLoopButton
                  :id='ids.loop'
                  v-model:looping='looping'
                  class='media-button preview-media-loop-button'
                />
                <media-tooltip
                  :trigger='ids.loop'
                  side='top'
                  class='media-popup media-popup-safe-area media-popup-transition media-popup-surface media-tooltip'
                >
                  <media-tooltip-label>{{ looping ? 'Disable loop' : 'Loop' }}</media-tooltip-label>
                </media-tooltip>
              </template>

              <button
                :id='ids.settings'
                type='button'
                :commandfor='ids.settings_menu'
                class='media-button media-settings-menu-trigger'
              >
                <media-icon
                  family='neutral'
                  name='gear'
                  class='media-button-icon-base media-settings-menu-trigger-icon'
                />
                <media-text
                  class='media-settings-menu-trigger-label'
                  token='menu.settings'
                >
                  Settings
                </media-text>
              </button>
              <media-tooltip
                :trigger='ids.settings'
                side='top'
                class='media-popup media-popup-safe-area media-popup-transition media-popup-surface media-tooltip'
              >
                <media-text token='menu.settings'>
                  Settings
                </media-text>
              </media-tooltip>
              <media-menu
                :id='ids.settings_menu'
                side='top'
                align='center'
                class='media-popup media-popup-surface media-menu-popup media-menu-resizable-popup'
              >
                <media-menu-content class='media-menu-content'>
                  <template
                    v-for='submenu in SETTINGS_SUBMENUS'
                    :key='submenu.key'
                  >
                    <media-menu-item
                      :commandfor='`${ids.settings_menu}-${submenu.key}`'
                      class='media-menu-trigger-item'
                    >
                      <media-icon
                        family='neutral'
                        :name='submenu.icon'
                        class='media-menu-trigger-item-icon'
                      />
                      <media-text :token='submenu.token'>
                        {{ submenu.label }}
                      </media-text>
                      <span class='media-menu-hint'>
                        <span
                          data-part='value'
                          class='media-menu-hint-label'
                        />
                        <media-icon
                          family='neutral'
                          name='chevron'
                          class='media-menu-forward-chevron'
                        />
                      </span>
                    </media-menu-item>
                    <media-menu-content
                      :id='`${ids.settings_menu}-${submenu.key}`'
                      class='media-menu-content'
                    >
                      <media-menu-item class='media-menu-back-item'>
                        <media-icon
                          family='neutral'
                          name='chevron'
                          class='media-menu-back-chevron'
                        />
                        <media-text :token='submenu.token'>
                          {{ submenu.label }}
                        </media-text>
                      </media-menu-item>
                      <media-menu-separator class='media-menu-separator' />
                      <!-- eslint-disable vue/no-v-text-v-html-on-component -- custom elements, static markup -->
                      <media-quality-radio-group
                        v-if='submenu.key === "quality"'
                        class='media-menu-radio-group'
                        v-html='QUALITY_ITEM_TEMPLATE'
                      />
                      <media-audio-track-radio-group
                        v-else-if='submenu.key === "audio"'
                        class='media-menu-radio-group'
                        v-html='MENU_ITEM_TEMPLATE'
                      />
                      <media-playback-rate-radio-group
                        v-else
                        class='media-menu-radio-group'
                        v-html='MENU_ITEM_TEMPLATE'
                      />
                      <!-- eslint-enable vue/no-v-text-v-html-on-component -->
                    </media-menu-content>
                  </template>
                  <!-- On narrow players the bar's Loop and PiP buttons live here instead. -->
                  <template v-if='narrow'>
                    <!-- eslint-disable vue/v-on-event-hyphenation -- a DOM event name, used as-is -->
                    <media-menu-checkbox-item
                      class='media-menu-trigger-item'
                      :checked='looping'
                      @checked-change='onLoopChange'
                    >
                      <!-- eslint-enable vue/v-on-event-hyphenation -->
                      <MediaLoopIcon
                        class='media-menu-trigger-item-icon'
                        :looping='looping'
                      />
                      <span>Loop</span>
                      <span class='media-menu-hint'>
                        <span class='media-menu-hint-label'>{{ looping ? 'On' : 'Off' }}</span>
                      </span>
                    </media-menu-checkbox-item>
                    <media-menu-item
                      v-if='pip_available'
                      class='media-menu-trigger-item'
                      @select='togglePip'
                    >
                      <media-icon
                        family='neutral'
                        :name='pip_active ? "pip-exit" : "pip-enter"'
                        class='media-menu-trigger-item-icon'
                      />
                      <span>Picture-in-picture</span>
                      <span class='media-menu-hint'>
                        <span class='media-menu-hint-label'>{{ pip_active ? 'On' : 'Off' }}</span>
                      </span>
                    </media-menu-item>
                  </template>
                </media-menu-content>
              </media-menu>

              <media-controls-group class='video-controls-trailing'>
                <template
                  v-for='button in trailing_buttons'
                  :key='button.tag'
                >
                  <component
                    :is='button.tag'
                    :id='`${ids.trailing}-${button.tag}`'
                    :class='`media-button ${button.tag}`'
                  >
                    <media-icon
                      family='neutral'
                      :name='`${button.icon}-enter`'
                      :class='`media-button-icon ${button.tag}-enter-icon`'
                    />
                    <media-icon
                      family='neutral'
                      :name='`${button.icon}-exit`'
                      :class='`media-button-icon ${button.tag}-exit-icon`'
                    />
                  </component>
                  <media-tooltip
                    :trigger='`${ids.trailing}-${button.tag}`'
                    side='top'
                    class='media-popup media-popup-safe-area media-popup-transition media-popup-surface media-tooltip'
                  >
                    <media-tooltip-label />
                    <media-tooltip-shortcut class='media-tooltip-shortcut' />
                  </media-tooltip>
                </template>
              </media-controls-group>
            </media-controls-group>
          </media-tooltip-group>
        </media-controls-content>
      </media-controls>

      <media-hotkey
        v-for='hotkey in VIDEO_HOTKEYS'
        :key='hotkey.keys'
        :keys='hotkey.keys'
        :action='hotkey.action'
        :value='hotkey.value'
      />

      <media-gesture
        type='tap'
        action='togglePaused'
        pointer='mouse'
        region='center'
      />
      <!--
        The skin's `tap → toggleControls` touch gesture is omitted: it fires
        after the double-tap window, undoing `usePausedTouchToggle`'s reveal
        on paused video. The container's built-in touch tap still toggles the
        controls while playing. So is its double-tap-centre fullscreen:
        fullscreen should only ever be a deliberate choice (button or `f`),
        and with no centre region the left / right seeks each cover a half.
      -->
      <media-gesture
        type='doubletap'
        action='seekStep'
        region='left'
      />
      <media-gesture
        type='doubletap'
        action='seekStep'
        region='right'
      />

      <media-status-announcer class='media-status-announcer' />

      <div class='video-status-indicators'>
        <media-volume-indicator class='media-indicator media-volume-indicator'>
          <media-volume-indicator-fill class='media-indicator-content media-volume-indicator-fill'>
            <media-icon
              family='neutral'
              name='volume-high'
              class='media-volume-indicator-high-icon'
            />
            <media-icon
              family='neutral'
              name='volume-low'
              class='media-volume-indicator-low-icon'
            />
            <media-icon
              family='neutral'
              name='volume-off'
              class='media-volume-indicator-off-icon'
            />
            <media-volume-indicator-value class='media-volume-indicator-value' />
          </media-volume-indicator-fill>
        </media-volume-indicator>
        <media-status-indicator
          actions='toggleFullscreen,togglePictureInPicture'
          class='media-indicator media-status-indicator'
        >
          <div class='media-indicator-content media-status-indicator-content'>
            <media-icon
              family='neutral'
              name='fullscreen-enter'
              class='media-status-indicator-fullscreen-enter-icon'
            />
            <media-icon
              family='neutral'
              name='fullscreen-exit'
              class='media-status-indicator-fullscreen-exit-icon'
            />
            <media-icon
              family='neutral'
              name='pip-enter'
              class='media-status-indicator-pip-enter-icon'
            />
            <media-icon
              family='neutral'
              name='pip-exit'
              class='media-status-indicator-pip-exit-icon'
            />
            <media-status-indicator-value class='media-status-indicator-value' />
          </div>
        </media-status-indicator>
        <media-seek-indicator class='media-seek-indicator'>
          <media-icon
            family='neutral'
            name='chevron'
            class='media-seek-indicator-icon'
          />
          <media-seek-indicator-value class='media-seek-indicator-value' />
        </media-seek-indicator>
        <media-status-indicator
          actions='togglePaused'
          class='media-playback-status-indicator'
        >
          <media-icon
            family='neutral'
            name='play'
            class='media-playback-status-indicator-play-icon'
          />
          <media-icon
            family='neutral'
            name='pause'
            class='media-playback-status-indicator-pause-icon'
          />
        </media-status-indicator>
      </div>
    </media-container>
  </video-player>
</template>

<script setup lang='ts'>
// Not part of the registry skin, which has no checkbox items.
import '@videojs/html/ui/menu-checkbox-item';
import '@videojs/html/video/player';
import { set, useElementSize } from '@vueuse/core';
import { computed, ref, useId, useTemplateRef } from 'vue';

import 'components/videojs/video/skin.ts';
import {
  useMediaLooping,
  useMediaPictureInPicture,
  useMediaPreferences,
  usePausedTouchToggle,
} from 'composables/media_player.ts';

import { VIDEO_HOTKEYS } from './media_player/hotkeys.ts';
import MediaLoopButton from './media_player/MediaLoopButton.vue';
import MediaLoopIcon from './media_player/MediaLoopIcon.vue';

import type { VideoPlayerElement } from '@videojs/html/video';
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

// The time slider's track, cloned per chapter (one chapter without metadata).
const CHAPTER_TEMPLATE = `<template>
  <div class="media-time-slider-chapter">
    <media-slider-track class="media-slider-track media-time-slider-chapter-track">
      <media-slider-buffer class="media-slider-buffer media-time-slider-chapter-layer"></media-slider-buffer>
      <media-slider-fill class="media-slider-fill media-time-slider-chapter-layer"></media-slider-fill>
    </media-slider-track>
  </div>
</template>`;

const ITEM_INDICATOR = `<media-menu-item-indicator force-mount class="media-menu-item-indicator">
  <media-icon family="neutral" name="check" class="media-menu-radio-item-icon"></media-icon>
</media-menu-item-indicator>`;

const QUALITY_ITEM_TEMPLATE = `<template>
  <media-menu-radio-item class="media-menu-radio-item">
    <span><span data-part="label"></span><sup data-part="tier" class="media-menu-tier"></sup></span>
    <span data-part="badge" class="media-menu-badge"></span>
    ${ITEM_INDICATOR}
  </media-menu-radio-item>
</template>`;

const MENU_ITEM_TEMPLATE = `<template>
  <media-menu-radio-item class="media-menu-radio-item">
    <span data-part="label"></span>
    ${ITEM_INDICATOR}
  </media-menu-radio-item>
</template>`;

const SETTINGS_SUBMENUS = [
  {
    icon: 'switches',
    key: 'quality',
    label: 'Quality',
    token: 'menu.quality',
  },
  {
    icon: 'speech',
    key: 'audio',
    label: 'Audio',
    token: 'menu.audio',
  },
  {
    icon: 'speed',
    key: 'speed',
    label: 'Speed',
    token: 'menu.speed',
  },
] as const;

// Each hides itself where unsupported (no Cast / AirPlay / PiP).
const TRAILING_BUTTONS = [
  {
    icon: 'cast',
    tag: 'media-cast-button',
  },
  {
    icon: 'airplay',
    tag: 'media-airplay-button',
  },
  {
    icon: 'pip',
    tag: 'media-pip-button',
  },
  {
    icon: 'fullscreen',
    tag: 'media-fullscreen-button',
  },
] as const;

// `trigger` / `commandfor` pair elements by id, so ids must be unique per player.
const uid = useId();
const ids = {
  loop: `${uid}-loop`,
  mute: `${uid}-mute`,
  play: `${uid}-play`,
  settings: `${uid}-settings`,
  settings_menu: `${uid}-settings-menu`,
  trailing: `${uid}-trailing`,
  volume: `${uid}-volume`,
};

const player = useTemplateRef<VideoPlayerElement>('player');
const container = useTemplateRef<HTMLElement>('container');
const video_ele = useTemplateRef<HTMLVideoElement>('video_ele');
const looping = useMediaLooping(video_ele);
const {
  active: pip_active,
  available: pip_available,
  toggle: togglePip,
} = useMediaPictureInPicture(player);

// The skin's own narrow breakpoint (`@container media-root (width < 42rem)`).
// Moving controls between the bar and the menu needs `v-if`, not CSS: menu
// keyboard navigation would still land on `display: none` items.
const NARROW_REM = 42;
const root_font_px = Number.parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
const { width: container_width } = useElementSize(container);
const narrow = computed<boolean>(() => container_width.value > 0 && container_width.value < NARROW_REM * root_font_px);

const trailing_buttons = computed(() => (narrow.value ?
  TRAILING_BUTTONS.filter((button) => button.tag !== 'media-pip-button') :
  TRAILING_BUTTONS));

function onLoopChange(event: Event): void {
  set(looping, (event as CustomEvent<{ checked: boolean; }>).detail.checked);
}

// The skin's container is an `inline-size` CSS container, so it can't shrink
// to its video the way a plain element would. It takes the dialog's height and
// derives its width from the video's own aspect ratio instead, which keeps the
// player as wide as the picture (clicks beside it still reach the backdrop).
const aspect_ratio = ref<string>('16 / 9');

function onLoadedMetadata(event: Event): void {
  const { videoHeight, videoWidth } = event.target as HTMLVideoElement;
  if (videoWidth && videoHeight) set(aspect_ratio, `${videoWidth} / ${videoHeight}`);
}

// The video always opens muted, so it restores the saved volume but never
// writes preferences back (matching media-chrome's `muted`-attribute rules).
useMediaPreferences(player, { save: false });
usePausedTouchToggle(player, container);
</script>

<style>
@reference '../../../../assets/styles/index.css';

@layer app {
  .preview-dialog--video .preview-dialog__content {
    @apply h-full;
  }

  .preview-video-player {
    @apply block h-full max-w-full;
  }

  /*
    Height from the dialog, width from the video's aspect ratio (capped at the
    available width, where the skin's own black background letterboxes it).
  */
  .preview-video-skin {
    /* Square corners, as the pre-Video.js player had (Neutral rounds 12px). */
    --media-border-radius: 0;

    @apply h-full max-w-full;

    aspect-ratio: var(--preview-video-aspect, 16 / 9);

    & > video {
      @apply size-full;
    }

    /*
      The app hides the controls after 2s idle even while paused (its
      pre-migration behaviour); the skin keys visibility off `data-visible`,
      which Video.js keeps on while paused. Hide on `data-user-active` instead,
      except while keyboard focus is inside the controls.
    */
    /* (`:has()` can't nest, so the focus exception is its own `:not(:has())`.) */
    &:has(.video-controls-content:not([data-user-active])):not(:has(
      .video-controls-content :focus-visible, .preview-video-centre-play:focus-visible
    )) {
      cursor: none;

      & .video-controls-backdrop {
        @apply opacity-0;
      }

      & .preview-video-centre-play {
        @apply opacity-0 pointer-events-none;
      }

      & .video-controls-content {
        @apply opacity-0 pointer-events-none;

        translate: 0 var(--media-hidden-offset);
        transition-duration: var(--media-duration-controls);
      }
    }

    /* The skin's own hide (playing and idle) applies to the centre button too. */
    &:has(.video-controls-content:not([data-visible])) .preview-video-centre-play {
      @apply opacity-0 pointer-events-none;
    }

    /*
      Mobile layout. The skin's narrow layout only re-flows the desktop bar, so
      below its 42rem breakpoint (and for any touch screen) the app adds a
      centre play button and bigger targets; the slider + time keep the
      skin's own first row, and the buttons get a full second row (start group
      left, end group right — Loop / PiP move to Settings via `narrow`).
    */
    & .preview-video-centre-play {
      --media-icon-size: calc(var(--media-spacing) * 8);

      z-index: 20;

      width: calc(var(--media-spacing) * 16);
      height: calc(var(--media-spacing) * 16);

      color: var(--media-controls-foreground);

      background-color: var(--media-popover);
      backdrop-filter: blur(8px);

      transition: opacity var(--media-duration-controls) ease-out;

      @apply absolute inset-0 m-auto hidden rounded-full;
    }

    @container media-root (width < 42rem) {
      & .preview-video-centre-play {
        @apply grid;
      }

      /* Its play / pause flash would sit right under the centre button. */
      & .media-playback-status-indicator {
        @apply hidden;
      }

      & .video-controls-start,
      & .video-controls-end,
      & .video-controls-trailing {
        gap: calc(var(--media-spacing) * 2);
      }
    }

    @media (pointer: coarse) {
      --media-control-size: calc(var(--media-spacing) * 11);

      & .preview-video-centre-play {
        @apply grid;
      }

      & .media-playback-status-indicator {
        @apply hidden;
      }
    }
  }
}
</style>
