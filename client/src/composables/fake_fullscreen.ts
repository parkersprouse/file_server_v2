import { inject, nextTick, onScopeDispose, readonly, ref } from 'vue';

import type { DeepReadonly, InjectionKey, Ref } from 'vue';

/*
 * "Fake fullscreen": an expanded mode the app draws itself, without ever
 * calling the Fullscreen API.
 *
 * On Android 17 Chromium-based browsers forward any Fullscreen API request to
 * the OS (`Activity.requestFullscreenMode`), which pulls a split-screen task
 * to the whole display. Page script can't intercept that, so the only fix is
 * to never make the request. This composable owns everything about the mode
 * except how it looks:
 *   • page scroll is locked while active;
 *   • one history entry is pushed on enter, so the Android back gesture exits
 *     the mode instead of leaving the page (it is removed again on exit);
 *   • Esc exits;
 *   • focus moves into the viewer on enter and back to the trigger on exit.
 *
 * It deliberately never locks the orientation: `screen.orientation.lock()`
 * only works in real fullscreen.
 */

export interface FakeFullscreenOptions {
  /**
   * Whether an Esc press may exit right now. Lets a host hand the key to
   * something that should take it first (an open menu, real fullscreen).
   */
  canEscape?: () => boolean;
  /** Called after the mode is left, whatever the exit path was. */
  onExit?: () => void;
}

export interface FakeFullscreen {
  active: DeepReadonly<Ref<boolean>>;
  /** `focus_target` receives focus once the expanded layout has rendered. */
  enter: (focus_target?: HTMLElement | null) => void;
  /**
   * `restore_history: false` leaves the pushed entry alone. Use it when a
   * navigation is what ended the mode: `history.back()` would undo it. (The
   * stray duplicate entry this leaves behind is an accepted limitation.)
   */
  exit: (restore_history?: boolean) => void;
  toggle: (focus_target?: HTMLElement | null) => void;
}

export const FAKE_FULLSCREEN_KEY: InjectionKey<FakeFullscreen> = Symbol('fake_fullscreen');

/** The expanded mode provided by the nearest host (`PreviewDialog`). */
export function useInjectedFakeFullscreen(): FakeFullscreen {
  const injected = inject(FAKE_FULLSCREEN_KEY);
  if (!injected) throw new Error('No fake fullscreen host was provided');
  return injected;
}

export function useFakeFullscreen(options: FakeFullscreenOptions = {}): FakeFullscreen {
  const active = ref<boolean>(false);
  let pushed = false;
  let previous_overflow = '';
  let trigger: Element | null = null;

  // Capture phase, and the press is stopped when it is taken: hosts close
  // themselves from their own (bubble-phase) window Esc handlers, and one press
  // must not both leave the mode and close the host.
  function onKey(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || (options.canEscape && !options.canEscape())) return;
    event.stopPropagation();
    exit();
  }

  function onPop(): void {
    // The browser already consumed our entry (back gesture / button).
    pushed = false;
    exit(false);
  }

  function enter(focus_target?: HTMLElement | null): void {
    if (active.value) return;
    active.value = true;
    trigger = document.activeElement;
    previous_overflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    // Copy the current state object so vue-router's survives: it reads its
    // `position` on popstate to work out the navigation delta, and an entry
    // without one would be treated as a navigation to undo.
    history.pushState(history.state, '');
    pushed = true;
    globalThis.addEventListener('keydown', onKey, true);
    globalThis.addEventListener('popstate', onPop);
    if (focus_target) void nextTick(() => {
      if (active.value) focus_target.focus({ preventScroll: true });
    });
  }

  function exit(restore_history: boolean = true): void {
    if (!active.value) return;
    active.value = false;
    document.documentElement.style.overflow = previous_overflow;
    globalThis.removeEventListener('keydown', onKey, true);
    globalThis.removeEventListener('popstate', onPop);
    if (pushed) {
      pushed = false;
      if (restore_history) history.back();
    }
    const restore_to = trigger;
    trigger = null;
    // Next tick: the trigger may only become focusable again once the host has
    // re-rendered its normal layout.
    if (restore_to instanceof HTMLElement) void nextTick(() => {
      if (!active.value && restore_to.isConnected) restore_to.focus({ preventScroll: true });
    });
    options.onExit?.();
  }

  function toggle(focus_target?: HTMLElement | null): void {
    if (active.value) exit();
    else enter(focus_target);
  }

  // Unmounting is usually part of a navigation, so the entry is left alone.
  onScopeDispose(() => {
    exit(false);
  });

  return {
    active: readonly(active),
    enter,
    exit,
    toggle,
  };
}
