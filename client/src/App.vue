<template>
  <TooltipProvider>
    <a href='#main-content' class='skip-link'>Skip to main content</a>
    <RouterView />

    <!--
      The preview dialog is a native `<dialog>` opened with `showModal()`, which
      promotes it to the browser's *top layer* — it paints above the whole
      normal DOM, so no z-index here can reach it, AND it marks everything
      outside its own subtree inert (unfocusable, unclickable, absent from the
      accessibility tree). Painting over it is possible from out here — a
      `popover` promoted after it wins on paint order — but inertness is decided
      by *subtree membership*, not paint order, so a toast raised that way is
      visible and nothing else: not clickable, and its `aria-live` never
      announces. Moving the toaster into the dialog is what actually clears
      both, so while the dialog is open it teleports into the same isolated
      overlay host the tooltips and dropdown menus use.
    -->
    <Teleport :disabled='!$store.preview_open' :to='toast_target'>
      <Toaster
        position='top-right'
        rich-colors
        :theme='$is_dark ? "dark" : "light"'
      />
    </Teleport>
  </TooltipProvider>
</template>

<script setup lang='ts'>
import { computed, watch } from 'vue';
import { RouterView } from 'vue-router';

import { useIsMobile } from 'composables/is_mobile.ts';
import { useDark } from 'composables/theme.ts';
import { useStore } from 'stores/global.ts';
import { Toaster } from 'ui/sonner/index.ts';

// Load the locally saved theme, if there is one. The app's theme is a
// manually toggled class, so the Toaster follows it rather than `system`.
const $is_dark = useDark();

// Drives the Toaster teleport above. The overlay host only exists (and is only
// rendered — a closed `<dialog>` is `display: none`) while the preview dialog
// is open, so the teleport has to stay disabled the rest of the time.
const $store = useStore();

// The selector has to *change* with the flag, not just sit there next to it:
// Vue resolves a Teleport's `to` once at mount and caches the resulting node,
// re-resolving only when `to` itself changes. At App mount `<RouterView>` has
// rendered nothing yet (the initial navigation resolves asynchronously), so
// `.preview-dialog__overlays` — which lives inside DirectoryView's
// PreviewDialog — does not exist, and a static `to` would cache a null target
// and silently never teleport, no matter what the flag did afterwards. Swapping
// the selector forces the re-resolve at the one moment the host is guaranteed
// to be mounted. The disabled-state value is arbitrary and never used to
// position anything; it just has to differ.
const toast_target = computed<string>(() => ($store.preview_open ? '.preview-dialog__overlays' : 'body'));

const $is_mobile = useIsMobile();

watch($is_mobile, (now_mobile) => {
  if (now_mobile) {
    document.body.classList.add('scrollbar-hidden');
  } else {
    document.body.classList.remove('scrollbar-hidden');
  }
}, { immediate: true });
</script>

<style>
.skip-link {
  position: absolute;
  z-index: 99999;
  left: -9999px;

  padding: 0.5rem 1rem;
  border: 2px solid var(--border);

  color: var(--foreground);
  text-decoration: none;

  background: var(--background);

  &:focus-visible {
    top: 0.5rem;
    left: 0.5rem;
    outline: 2px solid currentColor !important;
    outline-offset: 2px !important;
  }
}
</style>
