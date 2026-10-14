import { selectControls, selectPlayback, selectVolume } from '@videojs/html';
import { get, set, useEventListener } from '@vueuse/core';
import { computed, ref, toValue, watch } from 'vue';

import type { AudioPlayerElement } from '@videojs/html/audio';
import type { VideoPlayerElement } from '@videojs/html/video';
import type { MaybeRefOrGetter, WritableComputedRef } from 'vue';

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

// A touch counts as a tap below these limits (Video.js's own tap threshold).
const TAP_MAX_MS = 250;
const TAP_MAX_TRAVEL_PX = 10;

/**
 * The players hide their controls on idle even while paused (media-chrome
 * behaviour this app kept), so CSS keys off `userActive`. Video.js's own touch
 * tap toggles off `controlsVisible` instead, which is pinned on while paused —
 * so on a paused video a tap would only ever re-mark the user inactive, and
 * hidden controls could never be tapped back. While paused, this re-resolves
 * such a tap as a toggle of `userActive`. It runs on a macrotask so it lands
 * after Video.js's own `pointerup` handling on the same container.
 */
export function usePausedTouchToggle(
  player: MaybeRefOrGetter<MediaPlayerElement | null>,
  container: MaybeRefOrGetter<HTMLElement | null>,
): void {
  let tap: {
    active: boolean;
    at: number;
    x: number;
    y: number;
  } | null = null;

  useEventListener(container, 'pointerdown', (event: PointerEvent) => {
    tap = null;
    const store = toValue(player)?.store;
    if (event.pointerType !== 'touch' || !store?.target) return;
    tap = {
      active: selectControls(store.state)?.userActive ?? false,
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
    if (Date.now() - start.at > TAP_MAX_MS) return;
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) > TAP_MAX_TRAVEL_PX) return;
    // Only taps on the media surface itself toggle; controls handle their own.
    if (event.target !== toValue(container) && !(event.target instanceof HTMLMediaElement)) return;
    if (!selectPlayback(store.state)?.paused) return;
    setTimeout(() => selectControls(store.state)?.toggleControls(!start.active));
  });
}
