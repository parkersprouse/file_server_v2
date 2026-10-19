import { selectControls, selectPiP, selectVolume } from '@videojs/html';
import { get, set, useEventListener } from '@vueuse/core';
import { computed, onScopeDispose, readonly, ref, toValue, watch } from 'vue';

import type { AudioPlayerElement } from '@videojs/html/audio';
import type { VideoPlayerElement } from '@videojs/html/video';
import type { DeepReadonly, MaybeRefOrGetter, Ref, WritableComputedRef } from 'vue';

/*
 * Video.js (unlike media-chrome) doesn't persist volume / mute across sessions
 * (videojs/v10#944), so this follows its "Remember user preferences" guide.
 * The keys are media-chrome's own, so preferences saved before the migration
 * carry over, and the semantics mirror what media-chrome did for this app:
 *   • every player restores the saved volume;
 *   • a player that `save`s (audio) also restores the saved mute state and
 *     writes both back on every change;
 *   • a player that doesn't (video, which always opens muted) never writes and
 *     stays muted after its volume is restored.
 */
const VOLUME_KEY = 'media-chrome-pref-volume';
const MUTED_KEY = 'media-chrome-pref-muted';

type MediaPlayerElement = AudioPlayerElement | VideoPlayerElement;

interface VolumePrefs {
  muted: boolean | null;
  volume: number | null;
}

// Storage can be unavailable (private modes, blocked site data) — guard every
// access so playback never depends on it.
function readPrefs(): VolumePrefs {
  try {
    const volume = globalThis.localStorage.getItem(VOLUME_KEY);
    const muted = globalThis.localStorage.getItem(MUTED_KEY);
    return {
      muted: muted === null ? null : muted === 'true',
      volume: volume !== null && Number.isFinite(Number(volume)) ? Number(volume) : null,
    };
  } catch {
    return {
      muted: null,
      volume: null,
    };
  }
}

function writePrefs(volume: number, muted: boolean): void {
  try {
    globalThis.localStorage.setItem(VOLUME_KEY, String(volume));
    globalThis.localStorage.setItem(MUTED_KEY, String(muted));
  } catch {
    // Storage unavailable; skip persistence.
  }
}

export function useMediaPreferences(
  player: MaybeRefOrGetter<MediaPlayerElement | null>,
  { save }: { save: boolean; },
): void {
  watch(() => toValue(player), (ele, _old, onCleanup) => {
    if (!ele) return;
    const { store } = ele;
    const saved = readPrefs();
    let restored = false;
    let last: {
      volume: number;
      muted: boolean;
    } | null = null;

    // Store actions throw until the store attaches to the media element, so
    // the restore is retried from the subscription until `store.target` is set.
    const restore = (): boolean => {
      if (!store.target) return false;
      const volume = selectVolume(store.state);
      if (!volume) return true;
      const start_muted = volume.muted;
      // `setVolume` unmutes above zero, so the mute state is re-applied after.
      if (saved.volume !== null) volume.setVolume(saved.volume);
      const muted = save ? saved.muted ?? start_muted : start_muted;
      if (muted) volume.setMuted(true);
      // Seed the diff with the restored state so only later changes are saved.
      const current = selectVolume(store.state);
      if (current) last = {
        muted: current.muted,
        volume: current.volume,
      };
      return true;
    };

    const unsubscribe = store.subscribe(() => {
      if (!restored) {
        restored = restore();
        return;
      }
      if (!save) return;
      const volume = selectVolume(store.state);
      if (!volume || (volume.volume === last?.volume && volume.muted === last.muted)) return;
      last = {
        muted: volume.muted,
        volume: volume.volume,
      };
      writePrefs(last.volume, last.muted);
    });
    restored = restore();

    onCleanup(unsubscribe);
  }, { immediate: true });
}

/**
 * Video.js has no loop state or action (the player store only mirrors what its
 * features track), so looping stays on the media element's native `loop`
 * property. `loop` fires no event, which is why the state lives here — one
 * source of truth for every loop button bound to the same element.
 */
export function useMediaLooping(media: MaybeRefOrGetter<HTMLMediaElement | null>): WritableComputedRef<boolean> {
  const looping = ref<boolean>(false);

  // Adopt the element's own state whenever a (new) media element arrives.
  watch(() => toValue(media), (ele) => {
    set(looping, ele?.loop ?? false);
  }, { immediate: true });

  return computed({
    get: () => get(looping),
    set: (value) => {
      const ele = toValue(media);
      if (!ele) return;
      ele.loop = value;
      set(looping, value);
    },
  });
}

/**
 * Picture-in-picture state for controls outside `<media-pip-button>` (the
 * narrow video player's Settings menu item), which has to track availability
 * itself: the button hides where PiP is unsupported (Firefox), and so must it.
 * `toggle` runs synchronously in the caller's click so the request keeps its
 * user activation; it rejects before metadata has loaded, which is ignored.
 */
export function useMediaPictureInPicture(player: MaybeRefOrGetter<VideoPlayerElement | null>): {
  active: DeepReadonly<Ref<boolean>>;
  available: DeepReadonly<Ref<boolean>>;
  toggle: () => void;
} {
  const active = ref<boolean>(false);
  const available = ref<boolean>(false);

  watch(() => toValue(player), (ele, _old, onCleanup) => {
    if (!ele) return;
    const { store } = ele;
    const sync = (): void => {
      const pip = selectPiP(store.state);
      set(active, pip?.isPictureInPicture ?? false);
      set(available, pip?.pictureInPictureAvailability === 'available');
    };
    onCleanup(store.subscribe(sync));
    sync();
  }, { immediate: true });

  function toggle(): void {
    const store = toValue(player)?.store;
    const pip = store?.target ? selectPiP(store.state) : undefined;
    if (!pip) return;
    const request = pip.isPictureInPicture ? pip.exitPictureInPicture() : pip.requestPictureInPicture();
    request.catch(() => {
      // Not ready (no metadata yet) or refused by the browser; nothing to do.
    });
  }

  return {
    active: readonly(active),
    available: readonly(available),
    toggle,
  };
}

// A touch counts as a tap below these limits (Video.js's own tap threshold).
const TAP_MAX_MS = 250;
const TAP_MAX_TRAVEL_PX = 10;
// Video.js's double-tap window; a single tap only resolves once it has passed.
const DOUBLETAP_WINDOW_MS = 200;

/**
 * Touch taps on the media surface toggle the controls, but only once the
 * double-tap window has passed without a second tap, so double-tap seeking
 * doesn't flash the controls on and off.
 *
 * Video.js's controls feature toggles on every quick touch `pointerup` unless
 * a `tap → toggleControls` gesture claims it. The template therefore declares
 * that gesture `disabled` (a disabled binding still claims, but never fires)
 * and this does the toggling instead. It can't be left to the enabled gesture:
 * the store's `toggleControls` keys off `controlsVisible`, which Video.js pins
 * on while paused, whereas the players hide their controls on idle even while
 * paused (media-chrome behaviour this app kept), so CSS keys off `userActive`
 * and so does this toggle.
 */
export function useTouchTapToggle(
  player: MaybeRefOrGetter<MediaPlayerElement | null>,
  container: MaybeRefOrGetter<HTMLElement | null>,
): void {
  let tap: {
    at: number;
    x: number;
    y: number;
  } | null = null;
  let last_tap_at = 0;
  let pending: ReturnType<typeof setTimeout> | undefined;

  function cancelPending(): void {
    clearTimeout(pending);
    pending = undefined;
  }

  useEventListener(container, 'pointerdown', (event: PointerEvent) => {
    tap = null;
    if (event.pointerType !== 'touch' || !toValue(player)?.store.target) return;
    tap = {
      at: Date.now(),
      x: event.clientX,
      y: event.clientY,
    };
  });

  useEventListener(container, 'pointerup', (event: PointerEvent) => {
    const store = toValue(player)?.store;
    const start = tap;
    tap = null;
    if (!start || !store?.target || event.pointerType !== 'touch') return;
    const now = Date.now();
    if (now - start.at > TAP_MAX_MS) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_MAX_TRAVEL_PX) return;
    // Only taps on the media surface itself toggle. Elsewhere (the controls)
    // a tap only keeps visible controls awake: the disabled gesture claims
    // taps on non-interactive parts such as the bar's empty space, which
    // stops Video.js from resetting its idle timer for them.
    if (event.target !== toValue(container) && !(event.target instanceof HTMLMediaElement)) {
      const controls = selectControls(store.state);
      if (controls?.userActive) controls.toggleControls(true);
      return;
    }
    // A second tap inside the window is a double tap (a seek): drop the first.
    if (now - last_tap_at < DOUBLETAP_WINDOW_MS) {
      cancelPending();
      last_tap_at = 0;
      return;
    }
    last_tap_at = now;
    cancelPending();
    pending = setTimeout(() => {
      pending = undefined;
      last_tap_at = 0;
      const controls = selectControls(store.state);
      controls?.toggleControls(!controls.userActive);
    }, DOUBLETAP_WINDOW_MS);
  });

  onScopeDispose(cancelPending);
}
