<template>
  <dialog
    ref='dialog'
    :aria-label='entry?.name'
    :class='cn(
      "preview-dialog",
      $store.preview_bg_enabled && "preview-dialog--opaque-bg",
      preview_type?.class,
    )'
    @click='onClickDialog'
  >
    <template v-if='entry'>
      <!--
        Close-drag wrapper: translates down and scales slightly during a swipe
        from the top edge, fading out as the drag progresses toward dismiss.
      -->
      <div class='preview-dialog__close-drag' :style='close_overlay_style'>
        <div class='preview-dialog__header'>
          <PreviewDialogActions :entry='entry' />
        </div>

        <PreviewDialogTitle :entry='entry' />

        <PreviewDialogContent :class='{ "preview-dialog__content--gallery": has_multiple_media }'>
          <!--
            Gallery mode: a 3-cell filmstrip (previous / current / next), each
            exactly one viewport wide, translated as a whole. Dragging follows the
            pointer 1:1 (composables/preview_swipe.ts reports live dx via
            onDragUpdate); releasing past the dead zone slides the rest of the way
            across and reindexes, releasing short of it snaps back to center. Only
            the current cell mounts the real (lazy) preview component — the
            neighbors get a lightweight static peek so an adjacent video never
            autoplays/preloads.
          -->
          <div
            v-if='has_multiple_media'
            ref='slide_viewport'
            class='preview-dialog__slide-viewport'
          >
            <div class='preview-dialog__slide-track' :style='track_style'>
              <div class='preview-dialog__slide-cell'>
                <img
                  v-if='previous_media_entry?.preview_type === PreviewType.IMAGE'
                  :src='previous_media_entry.url'
                  :alt='previous_media_entry.name'
                  class='preview-dialog__slide-neighbor-img'
                  draggable='false'
                >
                <div
                  v-else-if='previous_media_entry'
                  class='preview-dialog__slide-neighbor-video'
                  aria-hidden='true'
                >
                  <span class='preview-dialog__slide-neighbor-video-glyph' />
                </div>
              </div>

              <div class='preview-dialog__slide-cell'>
                <component
                  :is='preview_type?.type'
                  :entry='entry'
                />
              </div>

              <div class='preview-dialog__slide-cell'>
                <img
                  v-if='next_media_entry?.preview_type === PreviewType.IMAGE'
                  :src='next_media_entry.url'
                  :alt='next_media_entry.name'
                  class='preview-dialog__slide-neighbor-img'
                  draggable='false'
                >
                <div
                  v-else-if='next_media_entry'
                  class='preview-dialog__slide-neighbor-video'
                  aria-hidden='true'
                >
                  <span class='preview-dialog__slide-neighbor-video-glyph' />
                </div>
              </div>
            </div>
          </div>

          <component
            v-else
            :is='preview_type?.type'
            :entry='entry'
          />
        </PreviewDialogContent>

        <!--
          Gallery navigation: cycle through the images/videos of the current
          directory, in the order they're currently listed. Only shown when the
          open file is itself media and there is more than one to move between.
        -->
        <template v-if='has_media_nav'>
          <button
            type='button'
            class='preview-dialog__nav preview-dialog__nav--prev'
            aria-label='Previous media'
            @click.stop='showPreviousMedia'
          >
            <icon-caret-left aria-hidden='true' />
          </button>

          <button
            type='button'
            class='preview-dialog__nav preview-dialog__nav--next'
            aria-label='Next media'
            @click.stop='showNextMedia'
          >
            <icon-caret-right aria-hidden='true' />
          </button>

          <div
            v-if='$store.show_media_tools'
            aria-live='polite'
            aria-atomic='true'
            class='preview-dialog__counter'
          >
            {{ current_media_index + 1 }} / {{ media_entries.length }}
          </div>
        </template>
      </div>
    </template>

    <!--
      Dedicated, always-present mount point for teleported overlays (the mobile
      action pill, dropdown menus). Teleports MUST target this isolated node
      rather than `.preview-dialog` directly: the dialog's own children are
      patched dynamically (the `v-if='entry'` block, the `has_media_nav`
      fragment), and mixing Vue-managed siblings with foreign teleported nodes
      in the same container corrupts the patch anchors on re-render/resize
      ("Node.insertBefore: Child to insert before is not a child of this node").
      `display: contents` keeps it out of layout; the dialog's top-layer
      promotion still covers its (fixed-positioned) teleported children.
    -->
    <div class='preview-dialog__overlays' />
  </dialog>
</template>

<script setup lang='ts'>
import { get, onKeyStroke, set, useMediaQuery, useMutationObserver } from '@vueuse/core';
import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { usePreviewSwipe } from 'composables/preview_swipe.ts';
import { PreviewType } from 'enums/preview_type.ts';
import { cn } from 'lib/utils.ts';
import { useStore } from 'stores/global.ts';

import type { UnsubscribeFunction } from 'emittery';
import type { Entry } from 'types/entry.d.ts';
import type { PreviewTypeAttrs } from 'types/preview_type_attrs.d.ts';
import type { PreviewTypeAttrsMapping } from 'types/preview_type_attrs_mapping.d.ts';
import type { CSSProperties } from 'vue';

// Lazy-load preview components
const AudioPreview = defineAsyncComponent(() =>
  import('components/directory_view/preview_dialog/file_viewers/AudioPreview.vue'));
const DocumentPreview = defineAsyncComponent(() =>
  import('components/directory_view/preview_dialog/file_viewers/DocumentPreview.vue'));
const ImagePreview = defineAsyncComponent(() =>
  import('components/directory_view/preview_dialog/file_viewers/ImagePreview.vue'));
const TextPreview = defineAsyncComponent(() =>
  import('components/directory_view/preview_dialog/file_viewers/TextPreview.vue'));
const VideoPreview = defineAsyncComponent(() =>
  import('components/directory_view/preview_dialog/file_viewers/VideoPreview.vue'));

// The preview types that participate in the prev/next media gallery.
const MEDIA_PREVIEW_TYPES: PreviewType[] = [PreviewType.IMAGE, PreviewType.VIDEO];

// Slide animation tuning. Surfacing these as store-backed user preferences
// (alongside things like `show_media_tools`) would be a natural follow-up —
// left as local constants for now since only the dead zone was asked for.
const SLIDE_MOTION_MS = 320;
const SLIDE_EASING = 'cubic-bezier(0.22, 0.61, 0.36, 1)';

const { entries = [] } = defineProps<{
  entries?: Entry[];
}>();

const $event_bus = useEventBus();
const event_unsubs = ref<UnsubscribeFunction[]>([]);
const $store = useStore();

const dialog = useTemplateRef<HTMLDialogElement>('dialog');
const slide_viewport = useTemplateRef<HTMLDivElement>('slide_viewport');
const entry = ref<Entry>();

// Live slide-transform state. `drag_x` is the signed px offset applied on top
// of the track's centered position — driven 1:1 by the pointer while dragging,
// then animated by commit()/snapBack() once the gesture ends.
const drag_x = ref<number>(0);
const is_dragging = ref<boolean>(false);
const is_animating = ref<boolean>(false);

// True only for the single instant reindex-and-reset update at the end of a
// commit. That update must NOT transition — the new "current" cell shows
// exactly the pixels the eased slide above just settled on, so animating it
// again would visibly slide through the pane beyond the target before
// correcting back.
const is_resetting = ref<boolean>(false);

// Set inside handleNext/handlePrevious so the paired onDragEnd (which always
// fires, whether or not this gesture committed) knows not to snap back.
let committed_this_gesture = false;
let settle_timeout: ReturnType<typeof setTimeout> | undefined;

// Swipe-down-to-close state. `close_drag_y` tracks live downward travel from
// the top edge; the dialog scales down and fades proportionally. Releasing past
// the threshold commits the dismiss with an exit animation; releasing short of
// it snaps back.
const close_drag_y = ref<number>(0);
const is_closing = ref<boolean>(false);
const is_close_snapping = ref<boolean>(false);

const reduced_motion = useMediaQuery('(prefers-reduced-motion: reduce)');

function motionMs(): number {
  return get(reduced_motion) ? 0 : SLIDE_MOTION_MS;
}

// The directory's images/videos, in the order they're currently listed.
const media_entries = computed<Entry[]>(() =>
  entries.filter((candidate) =>
    candidate.preview_type !== undefined && MEDIA_PREVIEW_TYPES.includes(candidate.preview_type)));

const current_media_index = computed<number>(() => {
  const current = get(entry);
  if (!current) return -1;
  return get(media_entries).findIndex((candidate) => candidate.path === current.path);
});

// The precondition for *any* gallery traversal: the open file is media and
// there's another one to move to. Drives the keyboard/swipe navigation, which
// stay available even with the on-screen controls hidden.
const has_multiple_media = computed<boolean>(() => get(current_media_index) !== -1 && get(media_entries).length > 1);

// Whether to show the on-screen prev/next buttons + counter. These are chrome,
// so they additionally respect the media-tools toggle; swipe deliberately does
// not, so hiding the chrome for an unobstructed view stays swipeable.
const has_media_nav = computed<boolean>(() => get(has_multiple_media) && $store.show_media_tools);

// The filmstrip's static, non-interactive peeks either side of the current
// (real, fully-mounted) preview. Wrap-around, same as showMediaAt below.
const previous_media_entry = computed<Entry | undefined>(() => {
  const media = get(media_entries);
  const index = get(current_media_index);
  if (media.length < 2 || index === -1) return;
  return media[(index - 1 + media.length) % media.length];
});

const next_media_entry = computed<Entry | undefined>(() => {
  const media = get(media_entries);
  const index = get(current_media_index);
  if (media.length < 2 || index === -1) return;
  return media[(index + 1) % media.length];
});

const track_style = computed<CSSProperties>(() => ({
  display: 'flex',
  height: '100%',
  transform: `translateX(calc(-33.3333% + ${get(drag_x)}px))`,
  transition: (get(is_dragging) || get(is_resetting)) ? 'none' : `transform ${motionMs()}ms ${SLIDE_EASING}`,
  width: '300%',
  willChange: 'transform',
}));

// Close-drag overlay: dims and shifts the entire dialog content downward as
// the user drags from the top edge. No transition while actively dragging;
// eased transition during snap-back or commit animation.
const CLOSE_COMMIT_DISTANCE = 80;
const close_overlay_style = computed<CSSProperties>(() => {
  const dy = Math.max(0, get(close_drag_y));
  const progress = Math.min(dy / CLOSE_COMMIT_DISTANCE, 1);
  const transitioning = get(is_closing) || get(is_close_snapping);
  return {
    opacity: 1 - progress * 0.6,
    transform: `translateY(${dy}px) scale(${1 - progress * 0.04})`,
    transition: transitioning ? `all ${motionMs()}ms ${SLIDE_EASING}` : 'none',
  };
});

// Static per preview type — built once, not per computed evaluation. Only the
// image class varies per file (SVGs get an extra hook), handled below.
const PREVIEW_TYPE_ATTRS: PreviewTypeAttrsMapping = {
  [PreviewType.AUDIO]: {
    class: 'preview-dialog--audio',
    type: AudioPreview,
  },
  [PreviewType.DOCUMENT]: {
    class: 'preview-dialog--doc',
    type: DocumentPreview,
  },
  [PreviewType.IMAGE]: {
    class: 'preview-dialog--image',
    type: ImagePreview,
  },
  [PreviewType.SPREADSHEET]: {
    class: 'preview-dialog--doc',
    type: DocumentPreview,
  },
  [PreviewType.TEXT]: {
    class: 'preview-dialog--text',
    type: TextPreview,
  },
  [PreviewType.VIDEO]: {
    class: 'preview-dialog--video',
    type: VideoPreview,
  },
};

const preview_type = computed<PreviewTypeAttrs | undefined>(() => {
  const file_entry = get(entry);
  if (!file_entry?.preview_type) return;
  const attrs = PREVIEW_TYPE_ATTRS[file_entry.preview_type];
  if (file_entry.preview_type === PreviewType.IMAGE && file_entry.name.endsWith('.svg')) {
    return {
      ...attrs,
      class: `${attrs.class} preview-dialog--svg`,
    };
  }
  return attrs;
});

onKeyStroke('Escape', close, { dedupe: true });
onKeyStroke('ArrowLeft', (event) => onArrowNav(event, showPreviousMedia), { dedupe: true });
onKeyStroke('ArrowRight', (event) => onArrowNav(event, showNextMedia), { dedupe: true });

useMutationObserver(dialog, (changes) => {
  const change = changes[0];
  if (!change) return;
  const dialog_ele = change.target as HTMLDialogElement;
  // The single writer of the open flag — every close path (Esc, backdrop
  // click, the close button) goes through the `open` attribute, so observing
  // it is the only way to track them all.
  $store.preview_open = dialog_ele.hasAttribute('open');
}, {
  attributeFilter: ['open'],
  subtree: false,
});

function open(new_entry: Entry): void {
  if ($store.preview_open) return;
  const dialog_ele = get(dialog);
  if (!dialog_ele) return;
  document.body.classList.add('overflow-hidden!');
  set(entry, new_entry);
  dialog_ele.showModal();
}

async function close(): Promise<void> {
  if (!$store.preview_open) return;
  const dialog_ele = get(dialog);
  if (!dialog_ele) return;
  document.body.classList.remove('overflow-hidden!');
  set(entry, undefined);
  dialog_ele.close();
}

// Swap the open file to another media entry without re-opening the dialog;
// reassigning `entry` re-renders the matching preview component in place.
function showMediaAt(index: number): void {
  const media = get(media_entries);
  if (media.length === 0) return;
  // Wrap around so the gallery is endless in both directions.
  const target = media[(index + media.length) % media.length];
  if (target) set(entry, target);
}

// Slides the filmstrip the rest of the way across (direction: 1 = next, -1 =
// previous), then reindexes onto the new entry with the transition switched
// off — see `is_resetting` above for why that step must be transition-free.
function commit(direction: 1 | -1): void {
  if (get(is_animating)) return;
  const viewport_width = get(slide_viewport)?.clientWidth ?? 400;
  const target = direction === 1 ? -viewport_width : viewport_width;

  clearTimeout(settle_timeout);
  set(is_animating, true);
  set(is_resetting, false);
  requestAnimationFrame(() => {
    set(drag_x, target);
    settle_timeout = setTimeout(() => {
      set(is_resetting, true);
      showMediaAt(get(current_media_index) + direction);
      set(drag_x, 0);
      set(is_animating, false);
    }, motionMs());
  });
}

function snapBack(): void {
  if (get(is_animating)) return;
  clearTimeout(settle_timeout);
  set(is_animating, true);
  set(is_resetting, false);
  requestAnimationFrame(() => {
    set(drag_x, 0);
    settle_timeout = setTimeout(() => set(is_animating, false), motionMs());
  });
}

// Swipe-down-to-close animation helpers. The dialog translates down and scales
// slightly as the finger drags; releasing past threshold animates it off-screen;
// releasing short of threshold snaps back to resting position.
function closeSnapBackAnimation(): void {
  if (get(is_closing)) return;
  set(is_close_snapping, true);
  set(close_drag_y, 0);
  const ms = motionMs();
  setTimeout(() => {
    set(is_close_snapping, false);
  }, ms);
}

async function closeCommitAnimation(): Promise<void> {
  if (get(is_closing)) return;
  set(is_closing, true);
  // Animate the rest of the way down and fade out completely.
  const viewport_height = window.innerHeight;
  set(close_drag_y, viewport_height);
  await new Promise((resolve) => setTimeout(resolve, motionMs()));
  await close();
  set(is_closing, false);
  set(close_drag_y, 0);
}

function showPreviousMedia(): void {
  if (!get(has_multiple_media)) return;
  committed_this_gesture = true;
  commit(-1);
}

function showNextMedia(): void {
  if (!get(has_multiple_media)) return;
  committed_this_gesture = true;
  commit(1);
}

// Touch swipe / mouse click-drag across the dialog cycles the gallery, mirroring
// the prev/next buttons. Enabled whenever the gallery is traversable — even with
// the on-screen controls hidden — and carefully inert over the video chrome and
// a zoomed image (see the composable). Live drag position feeds the filmstrip's
// drag-follow animation; the paired onDragEnd snaps back unless this gesture
// already committed via onNext/onPrevious.
usePreviewSwipe(dialog, {
  enabled: () => $store.preview_open && get(has_multiple_media) && !get(is_animating),
  enabledClose: () => $store.preview_open && !get(is_closing) && !get(is_close_snapping),
  onCloseCommit: closeCommitAnimation,
  onCloseDragUpdate: (dy) => {
    set(close_drag_y, dy);
  },
  onCloseSnapBack: closeSnapBackAnimation,
  onDragEnd: () => {
    set(is_dragging, false);
    if (!committed_this_gesture) snapBack();
    committed_this_gesture = false;
  },
  onDragUpdate: (dx) => {
    set(is_dragging, true);
    set(is_resetting, false);
    set(drag_x, dx);
  },
  onNext: showNextMedia,
  onPrevious: showPreviousMedia,
});

function onArrowNav(event: KeyboardEvent, navigate: () => void): void {
  // Like swipe, keyboard traversal stays available with the on-screen controls
  // hidden — it's gated only on there being another media file to move to.
  if (!$store.preview_open || !get(has_multiple_media) || get(is_animating)) return;
  // Leave the arrow keys to a focused video player so they still seek it.
  if (document.activeElement?.closest('media-controller')) return;
  event.preventDefault();
  navigate();
}

async function onClickDialog(event: Event): Promise<void> {
  const target = event.target as HTMLDivElement;
  if (!target) return;
  if ([
    'preview-dialog',
    'preview-dialog__close-drag',
    'preview-dialog__header',
    'preview-dialog__content',
    'preview-dialog__slide-cell',
    'preview-dialog__slide-track',
    'preview-dialog__slide-viewport',
  ].some((klass) => target.classList.contains(klass))) {
    await close();
  }
}

onMounted(() => {
  get(event_unsubs).push(
    $event_bus.on('show_dialog', ({ data: new_entry }) => open(new_entry)),
    $event_bus.on('hide_dialog', close),
  );
});

onUnmounted(() => {
  for (const unsub of get(event_unsubs)) unsub();
  clearTimeout(settle_timeout);
  // The dialog (and with it the overlay host anything teleports into) is going
  // away, so the flag must not survive it — a stale `true` would leave App.vue
  // aiming its Toaster teleport at a target that no longer exists.
  $store.preview_open = false;
});
</script>

<style>
@reference '../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    @apply fixed left-0 top-0 hidden w-full h-full max-w-full max-h-full
           m-auto p-0 border-none z-1000 bg-transparent;

    cursor: initial;

    /* Only the media previews are swipeable, so only they surrender horizontal
       gestures to the swipe-to-navigate handler (composables/preview_swipe.ts);
       the browser still owns vertical panning. Scoping this to the media
       variants (rather than the whole dialog) leaves text/document previews
       free to scroll horizontally — `touch-action` intersects down the ancestor
       chain, so a `pan-y` here could not be re-widened by a child. */
    &.preview-dialog--image,
    &.preview-dialog--video {
      touch-action: pan-y;
    }

    & .preview-dialog__overlays {
      display: contents;
    }

    &[open] {
      @apply flex flex-col flex-nowrap items-center justify-center;

      &::backdrop {
        @apply z-999 bg-black/85 max-w-full max-h-full w-full h-full;
      }
    }

    &.preview-dialog--opaque-bg::backdrop {
      @apply bg-zinc-500/85 dark:bg-zinc-700/85;
    }

    & .preview-dialog__close-drag {
      @apply absolute inset-0 flex flex-col flex-nowrap items-center justify-center;

      /* Transform origin at top center so scale shrinks toward the drag start. */
      will-change: transform, opacity;
      transform-origin: top center;
    }

    & .preview-dialog__header {
      @apply fixed left-0 top-0 w-full flex flex-row flex-nowrap items-start justify-end gap-4 z-1010;
      cursor: initial;
    }

    & .preview-dialog__title {
      @apply fixed bottom-0 right-0 flex z-1004 hover:z-1020;
    }

    & .preview-dialog__content {
      @apply z-1005 relative;
    }

    /* Gallery mode swaps the content box from "hug the media's intrinsic size"
       to a fixed viewport, so the three filmstrip cells have a stable frame to
       slide within. Non-gallery previews (single file, or docs/text/audio,
       which never join media_entries) are unaffected. */
    & .preview-dialog__content--gallery {
      /* w-[min(92vw,1600px)] h-[min(88vh,1000px)] */
      @apply max-w-full max-h-full;
    }

    & .preview-dialog__slide-viewport {
      @apply relative w-full h-full overflow-hidden;
      cursor: initial;
    }

    /*
    & .preview-dialog__slide-track {
      /* transform + transition are set inline (track_style) — they're live,
         per-frame values during a drag/commit, not static theme tokens. *\/
    }
    */

    & .preview-dialog__slide-cell {
      @apply flex-none w-1/3 h-full flex items-center justify-center px-4;

      & > * {
        @apply max-w-full max-h-full;
      }
    }

    & .preview-dialog__slide-neighbor-img {
      @apply max-w-full max-h-full object-contain select-none opacity-90;
    }

    & .preview-dialog__slide-neighbor-video {
      @apply flex items-center justify-center size-16 rounded-full bg-black/40;
    }

    & .preview-dialog__slide-neighbor-video-glyph {
      @apply block ml-1;
      width: 0;
      height: 0;
      border-top: 10px solid transparent;
      border-bottom: 10px solid transparent;
      border-left: 16px solid oklch(98.5% 0 0deg / 80%);
    }

    & .preview-dialog__nav {
      @apply fixed top-1/2 -translate-y-1/2 z-1008 flex items-center justify-center
             size-11 sm:size-12 rounded-full border bg-background/80 backdrop-blur-sm
             text-muted-foreground hover:text-primary hover:bg-background transition-colors;

      cursor: pointer;

      &.preview-dialog__nav--prev {
        @apply left-2 sm:left-4;
      }

      &.preview-dialog__nav--next {
        @apply right-2 sm:right-4;
      }

      & svg {
        @apply size-6 sm:size-7 shrink-0;
      }
    }

    & .preview-dialog__counter {
      @apply fixed top-2 left-1/2 -translate-x-1/2 z-1008 px-2.5 py-0.5 rounded-full border
             bg-background/80 backdrop-blur-sm text-muted-foreground text-xs tabular-nums select-none;
    }
  }
}
</style>
