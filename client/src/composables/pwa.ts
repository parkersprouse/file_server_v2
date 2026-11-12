import { get, set, useMediaQuery } from '@vueuse/core';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { computed, readonly, ref, watch } from 'vue';
import { toast } from 'vue-sonner';

import { os } from 'lib/browser.ts';

import type { ComputedRef, DeepReadonly, Ref } from 'vue';

/*
 * The app's side of being an installable PWA (the manifest and the service
 * worker themselves come from `vite-plugin-pwa`; see vite.config.ts):
 *   • `usePwaUpdates` registers the worker and offers new builds as a toast;
 *   • `usePwaInstall` backs the Install item in the navbar / settings sheet.
 */

// How often an open (possibly installed, rarely reloaded) app looks for a new build.
const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const UPDATE_TOAST_ID = 'pwa-update-available';

/**
 * Register the service worker in prompt mode: a new build's worker waits, an
 * "Update available" toast appears, and the worker is only activated (followed
 * by a reload) once the user accepts. Nothing reloads on its own, so playback
 * is never interrupted. Call once, from the app root.
 */
export function usePwaUpdates(): void {
  const { needRefresh, updateServiceWorker } = useRegisterSW({
    onRegisterError(error) {
      // Most often an untrusted certificate: Chromium refuses to register a
      // worker over one (the page still loads if the warning was clicked through).
      console.error('Service worker registration failed', error);
    },
    onRegisteredSW(_url, registration) {
      if (!registration) return;
      setInterval(() => {
        // Offline, or a worker still installing: try again next time round.
        if (registration.installing || !navigator.onLine) return;
        void registration.update().catch(() => {});
      }, UPDATE_CHECK_INTERVAL_MS);
    },
  });

  watch(needRefresh, (waiting) => {
    if (!waiting) return;
    toast('Update available', {
      action: {
        label: 'Reload',
        onClick: () => { void updateServiceWorker(true); },
      },
      description: 'A new version of the app is ready.',
      duration: Number.POSITIVE_INFINITY,
      id: UPDATE_TOAST_ID,
      // Dismissing only hides the toast; the waiting worker takes over on the
      // next launch once every tab / window of the app has closed.
      onDismiss: () => { set(needRefresh, false); },
    });
  }, { immediate: true });
}

/*
 * Install state is module-level because `beforeinstallprompt` fires once, early
 * (possibly before any component mounts), and its event is the only handle on
 * the browser's install prompt. main.ts imports this module for that reason.
 */
// eslint-disable-next-line no-undef -- ambient type from env.d.ts
const install_event = ref<BeforeInstallPromptEvent | null>(null);
const installed = ref<boolean>(false);

globalThis.addEventListener('beforeinstallprompt', (event) => {
  // Keep the browser's own mini-infobar away; the app offers Install itself.
  event.preventDefault();
  set(install_event, event);
});

globalThis.addEventListener('appinstalled', () => {
  set(install_event, null);
  set(installed, true);
});

// iOS has no install event (or API): the user adds the app from the Share
// sheet, so all the app can do there is explain how. iPadOS reports itself as
// a Mac, told apart by its touch screen.
const IS_IOS = os.name === 'iOS' || (os.name === 'macOS' && navigator.maxTouchPoints > 1);

export function usePwaInstall(): {
  /** Whether to offer an Install action at all. */
  available: ComputedRef<boolean>;
  /** Prompts where the browser can; resolves `false` where it can't (iOS). */
  install: () => Promise<boolean>;
  /** Install means manual "Add to Home Screen" steps here. */
  manual: boolean;
  standalone: DeepReadonly<Ref<boolean>>;
} {
  const display_standalone = useMediaQuery('(display-mode: standalone)');
  const standalone = computed<boolean>(() => get(display_standalone) || navigator.standalone === true);

  const available = computed<boolean>(() =>
    !get(standalone) && !get(installed) && (get(install_event) !== null || IS_IOS));

  async function install(): Promise<boolean> {
    const event = get(install_event);
    if (!event) return false;
    // The event can only prompt once, whatever the user answers.
    set(install_event, null);
    await event.prompt();
    return true;
  }

  return {
    available,
    install,
    manual: IS_IOS,
    standalone: readonly(standalone),
  };
}
