<template>
  <div
    class='preview-dialog__content'
    :class='{
      "bg-zinc-300!": alt_background_active,
    }'
  >
    <slot name='default' />
  </div>
</template>

<script setup lang='ts'>
import { get, useToggle } from '@vueuse/core';
import { onMounted, onUnmounted, ref } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';

import type { UnsubscribeFunction } from 'emittery';

const $event_bus = useEventBus();
const event_unsubs = ref<UnsubscribeFunction[]>([]);
const [alt_background_active, toggleAltBackground] = useToggle(false);

onMounted(async () => {
  const toggle_bg_unsub = $event_bus.on('toggle_dialog_content_bg', () => {
    toggleAltBackground();
  });

  get(event_unsubs).push(toggle_bg_unsub);
});

onUnmounted(() => {
  for (const unsub of get(event_unsubs)) unsub();
});
</script>

<style>
@reference '../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__content {
      @apply flex flex-col flex-nowrap place-content-center px-4 w-fit h-auto
             max-w-screen max-h-screen overflow-hidden self-center;

      cursor: initial;

      & object {
        @apply w-full h-full max-w-full max-h-full;
      }

      & media-controller {
        --media-control-background: var(--media-secondary-color, #0e0e15);

        @apply max-w-full max-h-full overflow-hidden;

        @variant hover {
          --media-control-hover-background: #232331;
        }

        & [slot='media'] {
          @apply max-w-full max-h-full;
        }

        & media-control-bar,
        & [slot='centered-chrome'] {
          @apply w-full;

          & [class$='-player__control'] {
            /* figure out how to not have tailwind override media chrome's styles */
            padding: 0.5rem;

            & svg {
              @apply shrink-0;
            }
          }
        }
      }
    }
  }
}
</style>
