import { get, set, useEventListener } from '@vueuse/core';
import { computed, onScopeDispose, ref, toValue } from 'vue';

import type { CSSProperties, ComputedRef, MaybeRefOrGetter } from 'vue';

// How long a press must rest before it picks its row up.
const HOLD_MS = 350;
// Travel (px) that turns a pending press into a scroll / plain drag instead.
const HOLD_SLOP_PX = 8;
// Auto-scroll: distance from the list's edge where it starts, and its speed.
const EDGE_PX = 48;
const SCROLL_PX_PER_FRAME = 10;
// A drop is followed by a `click` on whatever is under the pointer.
const CLICK_SUPPRESS_MS = 300;

export interface HoldReorderOptions {
  /** Presses starting inside a match never pick a row up (e.g. a row's own buttons). */
  ignore_selector?: string;
  /** Matches each reorderable row, in list order. */
  item_selector: string;
  onMove: (from: number, to: number) => void;
}

export interface HoldReorder {
  dragging: ComputedRef<boolean>;
  /** Inline style for the row at `index`: the dragged row follows the pointer, the rows it passes make room. */
  itemStyle: (index: number) => CSSProperties | undefined;
}

/**
 * Press-and-hold reordering for a vertical list of equal-height rows (mouse,
 * touch or pen). Holding a row for `HOLD_MS` picks it up; it then follows the
 * pointer while the rows it passes shift out of the way, and releasing calls
 * `onMove(from, to)`. Nothing in the DOM is moved here: the rows are only
 * translated, and the caller reorders its data (so a keyed `v-for` does the
 * real move). Moving before the hold completes cancels it, which is what
 * leaves ordinary scrolling and clicking alone; Esc cancels a drag.
 *
 * The list element should set `user-select: none` and
 * `-webkit-touch-callout: none` so a long press doesn't select text or open
 * the iOS callout.
 */
export function useHoldReorder(
  list: MaybeRefOrGetter<HTMLElement | null | undefined>,
  options: HoldReorderOptions,
): HoldReorder {
  // Indices are -1 while idle.
  const from = ref<number>(-1);
  const to = ref<number>(-1);
  const offset = ref<number>(0);
  const row_height = ref<number>(0);

  let hold_timer: ReturnType<typeof setTimeout> | undefined;
  let pending: {
    index: number;
    x: number;
    y: number;
  } | null = null;
  let count = 0;
  let start_y = 0;
  let start_scroll = 0;
  let last_y = 0;
  let frame = 0;
  let suppress_click_until = 0;

  const dragging = computed<boolean>(() => get(from) >= 0);

  function rows(): HTMLElement[] {
    return [...toValue(list)?.querySelectorAll<HTMLElement>(options.item_selector) ?? []];
  }

  function cancelHold(): void {
    clearTimeout(hold_timer);
    hold_timer = undefined;
    pending = null;
  }

  function reset(): void {
    cancelHold();
    cancelAnimationFrame(frame);
    set(from, -1);
    set(to, -1);
    set(offset, 0);
  }

  // Place the dragged row under the pointer (kept inside the list) and work
  // out which slot that is.
  function update(): void {
    const ele = toValue(list);
    const height = get(row_height);
    if (!ele || height <= 0) return;
    const index = get(from);
    const raw = last_y - start_y + (ele.scrollTop - start_scroll);
    const clamped = Math.min((count - 1 - index) * height, Math.max(-index * height, raw));
    set(offset, clamped);
    set(to, index + Math.round(clamped / height));
  }

  function autoScroll(): void {
    const ele = toValue(list);
    if (!ele || !get(dragging)) return;
    const rect = ele.getBoundingClientRect();
    if (last_y < rect.top + EDGE_PX) ele.scrollTop -= SCROLL_PX_PER_FRAME;
    else if (last_y > rect.bottom - EDGE_PX) ele.scrollTop += SCROLL_PX_PER_FRAME;
    update();
    frame = requestAnimationFrame(autoScroll);
  }

  function pickUp(): void {
    const ele = toValue(list);
    const start = pending;
    hold_timer = undefined;
    pending = null;
    const items = rows();
    const row = start ? items[start.index] : undefined;
    if (!ele || !start || !row) return;
    count = items.length;
    start_y = start.y;
    last_y = start.y;
    start_scroll = ele.scrollTop;
    set(row_height, row.getBoundingClientRect().height);
    set(offset, 0);
    set(to, start.index);
    set(from, start.index);
    // A short buzz where supported, like a native list's pick-up.
    if ('vibrate' in navigator) navigator.vibrate(10);
    frame = requestAnimationFrame(autoScroll);
  }

  useEventListener(list, 'pointerdown', (event: PointerEvent) => {
    reset();
    if (event.button !== 0 || !event.isPrimary) return;
    const target = event.target as HTMLElement | null;
    if (options.ignore_selector && target?.closest(options.ignore_selector)) return;
    const row = target?.closest<HTMLElement>(options.item_selector);
    const items = rows();
    const index = row ? items.indexOf(row) : -1;
    // A single row has nowhere to go.
    if (index === -1 || items.length < 2) return;
    pending = {
      index,
      x: event.clientX,
      y: event.clientY,
    };
    hold_timer = setTimeout(pickUp, HOLD_MS);
  });

  useEventListener(window, 'pointermove', (event: PointerEvent) => {
    if (pending) {
      if (Math.hypot(event.clientX - pending.x, event.clientY - pending.y) > HOLD_SLOP_PX) cancelHold();
      return;
    }
    if (!get(dragging)) return;
    last_y = event.clientY;
    update();
  });

  useEventListener(window, 'pointerup', () => {
    if (!get(dragging)) {
      cancelHold();
      return;
    }
    const move_from = get(from);
    const move_to = get(to);
    suppress_click_until = Date.now() + CLICK_SUPPRESS_MS;
    reset();
    if (move_from !== move_to) options.onMove(move_from, move_to);
  });

  useEventListener(window, 'pointercancel', reset);

  // The release after a drag would otherwise activate the row under it.
  useEventListener(list, 'click', (event: MouseEvent) => {
    if (Date.now() > suppress_click_until) return;
    suppress_click_until = 0;
    event.preventDefault();
    event.stopPropagation();
  }, { capture: true });

  // Once a row is picked up the gesture is a drag, not a scroll. The listener
  // has to be in place (non-passive) before the touch starts to be allowed to
  // cancel its moves.
  useEventListener(list, 'touchmove', (event: TouchEvent) => {
    if (get(dragging) && event.cancelable) event.preventDefault();
  }, { passive: false });

  // Android's long-press context menu would interrupt the hold.
  useEventListener(list, 'contextmenu', (event: MouseEvent) => {
    if (pending || get(dragging)) event.preventDefault();
  });

  // Esc drops the row back where it was, without also closing what hosts the list.
  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if (event.key !== 'Escape' || !get(dragging)) return;
    event.preventDefault();
    event.stopPropagation();
    reset();
  }, { capture: true });

  onScopeDispose(reset);

  function itemStyle(index: number): CSSProperties | undefined {
    const source = get(from);
    if (source < 0) return undefined;
    if (index === source) return {
      position: 'relative',
      transform: `translateY(${get(offset)}px)`,
      zIndex: 1,
    };
    const target = get(to);
    const height = get(row_height);
    if (source < target && index > source && index <= target) return { transform: `translateY(${-height}px)` };
    if (target < source && index >= target && index < source) return { transform: `translateY(${height}px)` };
    return undefined;
  }

  return {
    dragging,
    itemStyle,
  };
}
