import { useEventListener } from '@vueuse/core';
import { toValue } from 'vue';

import { useImageView } from 'composables/image_view.ts';

import type { MaybeRefOrGetter } from 'vue';

/**
 * Swipe / click-drag gallery navigation for the preview dialog, plus a
 * "swipe down from the top edge to dismiss" gesture.
 *
 * Built on raw Pointer Events rather than `@vueuse/core`'s `usePointerSwipe`
 * on purpose: that composable registers its listeners as `passive` and calls
 * `setPointerCapture(e.target)` on the *first* `pointerdown`, before it knows
 * the gesture's intent and with no way to veto the start. That would rip the
 * pointer out from under any child that drives its own drag — the video seek
 * bar, a zoomed image's panning — which is precisely what we must not do.
 *
 * Instead we watch the stream ourselves and only take over once we've locked
 * onto a gesture that didn't begin on an interactive control:
 *
 *   1. `pointerdown` — record the origin, but grab nothing yet. Note whether
 *                      the press landed inside the close zone at the top edge.
 *   2. `pointermove` — once past a small threshold, decide the dominant axis.
 *                      Horizontal → gallery swipe (capture + preventDefault).
 *                      Vertical from close zone → dismiss gesture (override
 *                      `touch-action: pan-y`). Vertical elsewhere → yield to
 *                      native scrolling.
 *   3. `pointerup`   — horizontal past threshold → navigate. Vertical from
 *                      close zone past threshold → dismiss. Otherwise snap
 *                      back. `onDragEnd` always fires last.
 *
 * A single `MaybeRefOrGetter` target (the `<dialog>`) makes the entire screen —
 * backdrop included — a swipe surface.
 */

// Descendants that own their own drag / pointer gestures, so a press starting
// on one must NEVER be hijacked as a gallery swipe:
//   • media-control-bar / [slot='centered-chrome'] → the video seek bar and its
//     transport buttons (the seek range's shadow slider retargets to the
//     <media-control-bar> host as the event leaves the shadow tree).
//   • .preview-dialog__nav / __header / __title    → the dialog's own controls.
//   • .preview-dialog__overlays                    → the teleported action pill
//     and dropdown menus that live in the isolated overlay host.
//   • the generic interactive controls             → buttons, links, inputs.
// Note: <media-controller> itself is intentionally absent so the video *surface*
// stays swipeable — only its chrome is excluded.
const NO_SWIPE_SELECTOR = [
  '.preview-dialog__header',
  '.preview-dialog__nav',
  '.preview-dialog__overlays',
  '.preview-dialog__title',
  '[role="slider"]',
  '[slot="centered-chrome"]',
  'a[href]',
  'button',
  'input',
  'media-control-bar',
  'select',
  'textarea',
].join(',');

// Travel (px) before we commit to an axis — small enough that the swipe feels
// responsive, large enough that a jittery tap doesn't lock us into swiping.
const AXIS_LOCK_THRESHOLD = 15;
// Horizontal travel (px) required on release to actually change media, unless
// the caller overrides it via `options.commitThresholdPx` (the tweakable
// "dead zone").
const DEFAULT_COMMIT_THRESHOLD = 100;
// Distance from the top edge of the dialog within which a downward drag is
// treated as a "swipe down to close" gesture rather than native scrolling.
// Matches the typical pull-to-dismiss affordance (~60px).
const CLOSE_ZONE_HEIGHT = 60;
// Downward travel (px) required inside the close zone to dismiss the dialog.
const CLOSE_COMMIT_THRESHOLD = 80;

// The dominant axis of the in-flight gesture. `undecided` until we clear the
// lock threshold; `vertical` means we've handed the gesture back to the browser.
type SwipeAxis = 'undecided' | 'horizontal' | 'vertical';
// Whether the current gesture is a potential "swipe down to close". Set on
// pointerdown when the origin is inside the close zone at the top edge.
let is_close_gesture = false;

export interface UsePreviewSwipeOptions {
  /**
   * Horizontal travel (px) required on release to commit navigation — the
   * "dead zone" below which a swipe snaps back instead of advancing.
   * Defaults to 50px.
   */
  commitThresholdPx?: number;
  /** Gate: only begin tracking while the gallery is navigable (open + >1 media). */
  enabled: () => boolean;
  /**
   * Fires once per gesture on release/cancel, whether or not it committed —
   * AFTER onNext/onPrevious, so the caller can tell "this release also
   * navigated" (a commit flag it set in the onNext/onPrevious handler) from
   * "this release did nothing" (snap back to the current pane).
   */
  onDragEnd?: () => void;
  /**
   * Live horizontal travel (px, signed) while a horizontal drag is in progress.
   * Drive a drag-follow slide animation from this; do not navigate from it —
   * navigation is decided on release and reported via onNext / onPrevious.
   */
  onDragUpdate?: (dx: number) => void;
  /** Committed left swipe (content dragged left → advance to the next media). */
  onNext: () => void;
  /** Committed right swipe (content dragged right → go back to the previous). */
  onPrevious: () => void;
  /**
   * Called during a downward drag inside the close zone at the top edge,
   * reporting live signed vertical travel (positive = down). Drive a
   * drag-follow dim/shrink animation from this value.
   */
  onCloseDragUpdate?: (dy: number) => void;
  /**
   * Called when a downward swipe inside the close zone clears the commit
   * threshold and should dismiss the dialog. The caller animates the exit
   * then closes.
   */
  onCloseCommit?: () => void;
  /**
   * Called when a close-zone drag ends without committing (short swipe).
   * The caller animates snap-back to the resting position.
   */
  onCloseSnapBack?: () => void;
}

export function usePreviewSwipe(
  target: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: UsePreviewSwipeOptions,
): void {
  const view = useImageView();

  let pointer_id: number | undefined;
  let start_x = 0;
  let start_y = 0;
  let axis: SwipeAxis = 'undecided';
  // Set once a horizontal swipe engages, so the trailing `click` (which would
  // otherwise close the dialog via the backdrop, or toggle video playback) can
  // be swallowed. Reset on the next press and after that click is absorbed.
  let did_swipe = false;

  function resolveTarget(): HTMLElement | null {
    return toValue(target) ?? null;
  }

  function endGesture(): void {
    const element = resolveTarget();
    if (pointer_id !== undefined && element?.hasPointerCapture(pointer_id)) {
      try {
        element.releasePointerCapture(pointer_id);
      } catch { /* already released */ }
    }
    pointer_id = undefined;
    axis = 'undecided';
    is_close_gesture = false;
  }

  useEventListener(target, 'pointerdown', (event: PointerEvent) => {
    // Clear the swipe flag on EVERY press, before any early-return below, so a
    // stale swipe from a prior gesture can never suppress this press's click
    // (e.g. tapping a button, the seek bar, or Close right after a swipe).
    did_swipe = false;

    if (!options.enabled()) return;
    // Primary button only for mouse; touch / pen always report button 0.
    if (event.button !== 0) return;
    // Never wrestle the gesture away from a control that drags itself.
    const origin = event.target as HTMLElement | null;
    if (origin?.closest(NO_SWIPE_SELECTOR)) return;
    // A zoomed image owns the pointer for panning — leave it be.
    if (view.scale > 1) return;

    pointer_id = event.pointerId;
    start_x = event.clientX;
    start_y = event.clientY;
    axis = 'undecided';

    // Determine if this press is inside the close zone at the top edge of the
    // dialog. Only a downward drag from here will attempt to dismiss.
    const element = resolveTarget();
    is_close_gesture = element !== null && event.clientY - element.getBoundingClientRect().top <= CLOSE_ZONE_HEIGHT;
  });

  useEventListener(target, 'pointermove', (event: PointerEvent) => {
    if (pointer_id !== event.pointerId) return;
    const dx = event.clientX - start_x;
    const dy = event.clientY - start_y;

    if (axis === 'undecided') {
      if (Math.hypot(dx, dy) < AXIS_LOCK_THRESHOLD) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal dominates → gallery swipe as usual.
        axis = 'horizontal';
        did_swipe = true;
        try {
          resolveTarget()?.setPointerCapture(event.pointerId);
        } catch { /* best-effort */ }
      } else if (is_close_gesture && dy > 0) {
        // Vertical downward from the top edge → close gesture. Override
        // `touch-action: pan-y` by capturing and preventing default.
        axis = 'vertical';
        did_swipe = true;
        try {
          resolveTarget()?.setPointerCapture(event.pointerId);
        } catch { /* best-effort */ }
      } else {
        // Vertical but not from the close zone: yield to native scrolling.
        axis = 'vertical';
        return;
      }
    }

    if (axis === 'horizontal') {
      event.preventDefault();
      options.onDragUpdate?.(dx);
    }

    // Close-zone downward drag: prevent the browser from interpreting this as
    // a scroll (beats `touch-action: pan-y`) and report live delta.
    if (axis === 'vertical' && is_close_gesture && dy > 0) {
      event.preventDefault();
      options.onCloseDragUpdate?.(dy);
    }
  }, { passive: false });

  useEventListener(target, 'pointerup', (event: PointerEvent) => {
    if (pointer_id !== event.pointerId) return;
    const dx = event.clientX - start_x;
    const dy = event.clientY - start_y;

    if (axis === 'horizontal' && Math.abs(dx) >= (options.commitThresholdPx ?? DEFAULT_COMMIT_THRESHOLD)) {
      if (dx < 0) options.onNext();
      else options.onPrevious();
    }

    // Close-zone downward swipe committed? Dismiss.
    if (axis === 'vertical' && is_close_gesture && dy >= CLOSE_COMMIT_THRESHOLD) {
      options.onCloseCommit?.();
      endGesture();
      options.onDragEnd?.();
      return;
    }

    // Close-zone drag didn't reach threshold → snap back.
    if (axis === 'vertical' && is_close_gesture && dy > 0) {
      options.onCloseSnapBack?.();
    }

    endGesture();
    options.onDragEnd?.();
  });

  useEventListener(target, 'pointercancel', (event: PointerEvent) => {
    if (pointer_id !== event.pointerId) return;
    // A cancel never navigates and produces no trailing click, so drop the
    // suppression flag now rather than carrying it to the next unrelated click.
    // (pointerup must NOT do this — it needs the flag to survive to the click.)
    did_swipe = false;
    // Cancel a close-gesture drag in flight → snap back.
    if (is_close_gesture && axis === 'vertical') {
      options.onCloseSnapBack?.();
    }
    is_close_gesture = false;
    endGesture();
    options.onDragEnd?.();
  });

  // Swallow the click that terminates a mouse drag so a backdrop swipe doesn't
  // close the dialog and a swipe over the video doesn't toggle playback. Runs
  // in the capture phase so it beats the dialog's own click handler and
  // media-chrome. Mirrors the same trick in ImagePreview's pan handling.
  useEventListener(target, 'click', (event: MouseEvent) => {
    if (!did_swipe) return;
    event.stopPropagation();
    event.preventDefault();
    did_swipe = false;
  }, { capture: true });
}
