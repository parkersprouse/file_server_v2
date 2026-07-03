import { useEventListener } from '@vueuse/core';
import { toValue } from 'vue';

import { useImageView } from 'composables/image_view.ts';

import type { MaybeRefOrGetter } from 'vue';

/**
 * Swipe / click-drag gallery navigation for the preview dialog.
 *
 * Built on raw Pointer Events rather than `@vueuse/core`'s `usePointerSwipe`
 * on purpose: that composable registers its listeners as `passive` and calls
 * `setPointerCapture(e.target)` on the *first* `pointerdown`, before it knows
 * the gesture's intent and with no way to veto the start. That would rip the
 * pointer out from under any child that drives its own drag — the video seek
 * bar, a zoomed image's panning — which is precisely what we must not do.
 *
 * Instead we watch the stream ourselves and only take over once we've locked
 * onto a horizontal gesture that didn't begin on an interactive control:
 *
 *   1. `pointerdown`  — record the origin, but grab nothing yet.
 *   2. `pointermove`  — once past a small threshold, decide the dominant axis.
 *                       Vertical → yield (native scroll). Horizontal → capture
 *                       the pointer on the dialog and `preventDefault` so the
 *                       browser can't reinterpret the drag as a scroll/zoom.
 *   3. `pointerup`    — if the horizontal travel cleared the commit threshold,
 *                       fire the navigation callback.
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
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[role="slider"]',
  'media-control-bar',
  '[slot="centered-chrome"]',
  '.preview-dialog__nav',
  '.preview-dialog__header',
  '.preview-dialog__title',
  '.preview-dialog__overlays',
].join(',');

// Travel (px) before we commit to an axis — small enough that the swipe feels
// responsive, large enough that a jittery tap doesn't lock us into swiping.
const AXIS_LOCK_THRESHOLD = 10;
// Horizontal travel (px) required on release to actually change media.
const COMMIT_THRESHOLD = 50;

// The dominant axis of the in-flight gesture. `undecided` until we clear the
// lock threshold; `vertical` means we've handed the gesture back to the browser.
type SwipeAxis = 'undecided' | 'horizontal' | 'vertical';

export interface UsePreviewSwipeOptions {
  /** Gate: only begin tracking while the gallery is navigable (open + >1 media). */
  enabled: () => boolean;
  /** Committed left swipe (content dragged left → advance to the next media). */
  onNext: () => void;
  /** Committed right swipe (content dragged right → go back to the previous). */
  onPrevious: () => void;
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
  });

  useEventListener(target, 'pointermove', (event: PointerEvent) => {
    if (pointer_id !== event.pointerId) return;
    const dx = event.clientX - start_x;
    const dy = event.clientY - start_y;

    if (axis === 'undecided') {
      if (Math.hypot(dx, dy) < AXIS_LOCK_THRESHOLD) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        axis = 'horizontal';
        did_swipe = true;
        // Take the pointer so the remainder of the drag lands on the dialog
        // even if it strays over the video surface or another child.
        try {
          resolveTarget()?.setPointerCapture(event.pointerId);
        } catch { /* best-effort */ }
      } else {
        // Vertical: yield the whole gesture back to native scrolling.
        axis = 'vertical';
        return;
      }
    }

    // Non-passive listener → stop the browser turning the drag into a scroll.
    if (axis === 'horizontal') event.preventDefault();
  }, { passive: false });

  useEventListener(target, 'pointerup', (event: PointerEvent) => {
    if (pointer_id !== event.pointerId) return;
    const dx = event.clientX - start_x;
    if (axis === 'horizontal' && Math.abs(dx) >= COMMIT_THRESHOLD) {
      if (dx < 0) options.onNext();
      else options.onPrevious();
    }
    endGesture();
  });

  useEventListener(target, 'pointercancel', (event: PointerEvent) => {
    if (pointer_id !== event.pointerId) return;
    // A cancel never navigates and produces no trailing click, so drop the
    // suppression flag now rather than carrying it to the next unrelated click.
    // (pointerup must NOT do this — it needs the flag to survive to the click.)
    did_swipe = false;
    endGesture();
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
