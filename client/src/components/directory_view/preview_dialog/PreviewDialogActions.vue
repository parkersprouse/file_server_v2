<!--
  Preview action bar. The mobile and desktop bars are entirely different
  structures (different controls, plus reka-ui portals and a teleported pill on
  mobile), so each lives in its own component and we swap between them by
  breakpoint.

  Two rules make the breakpoint cross safe, both learned the hard way from
  "Node.insertBefore: Child to insert before is not a child of this node":
    1. Swap whole COMPONENTS (not two inline `v-if`/`v-else` fragments) so each
       variant's portals/teleports are torn down within their own lifecycle.
    2. Each variant must render a SINGLE root element (the `.preview-dialog__
       actions` div), so the swap is an atomic node replacement rather than a
       fragment reconciliation. Do NOT wrap them in a div here — that would give
       each variant a fragment position again and reintroduce the crash.
-->

<template>
  <PreviewDialogActionsMobile
    v-if='$is_mobile'
    :entry='entry'
  />
  <PreviewDialogActionsDesktop
    v-else
    :entry='entry'
  />
</template>

<script setup lang='ts'>
import { useIsMobile } from 'composables/is_mobile.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $is_mobile = useIsMobile();
</script>

<style>
@reference '../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__header {
      & .preview-dialog__actions {
        @apply grow-0 shrink w-fit flex flex-row flex-nowrap items-center justify-end gap-1 sm:gap-0
               bg-background border-b border-l;

        & svg.icon {
          @apply size-7 sm:size-6;
        }

        & a,
        & button {
          @apply dark:text-muted-foreground dark:hover:text-primary;
        }
      }
    }

    /* Floating control pill — thumb-reachable, translucent, minimal footprint */
    & .preview-dialog__pill {
      @apply fixed bottom-4 left-1/2 -translate-x-1/2 z-1015
             flex flex-row flex-nowrap items-center gap-0.5 p-1
             rounded-full border bg-background/85 backdrop-blur-md
             shadow-[0_6px_20px_rgba(0,0,0,0.4)];

      & svg.icon {
        @apply size-6;
      }

      & a,
      & button {
        @apply rounded-full dark:text-muted-foreground dark:hover:text-primary;
      }

      /* The pill's ghost buttons get a rounded, slightly tighter footprint */
      & .ghost-ext {
        @apply rounded-full p-2!;
      }

      /* Keep the separators inside the existing image-actions cluster compact */
      & [data-slot='separator'] {
        @apply mx-0.5 h-6! self-center!;
      }

      & .preview-dialog__zoom-level {
        @apply px-1;
      }
    }
  }

  .preview-dialog__overflow__trigger {
    &[data-slot='dropdown-menu-trigger'] {
      &[data-state='open'] {
        @apply ghost-ext--active!;
      }
    }
  }

  /* Overflow dropdown: labeled rows, comfortable touch targets, above the dialog */
  [data-slot='dropdown-menu-content'].preview-dialog__overflow {
    @apply z-1100 min-w-52;

    & [data-slot='dropdown-menu-item'] {
      @apply gap-3 px-3 py-2.5 text-sm cursor-pointer;

      & svg {
        @apply size-[1.15rem] shrink-0 text-muted-foreground;
      }

      & a {
        @apply flex flex-row items-center gap-3 w-full;
      }
    }
  }
}
</style>
