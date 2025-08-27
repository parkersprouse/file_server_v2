<template>
  <div class='preview-dialog__actions'>
    <PreviewDialogTitleButton
      v-if='$is_mobile'
      :entry='entry'
    />
    <Button
      variant='ghost'
      aria-label='Invert colors'
      class='ghost-ext h-auto!'
      @click.prevent='() => { $store.preview_bg_enabled = !$store.preview_bg_enabled; }'
    >
      <icon-checkerboard />
    </Button>
    <a
      aria-label='Download file'
      :href='`${entry.url}?download`'
      download
      class='ghost-ext h-auto!'
    >
      <icon-download-simple />
    </a>
    <a
      aria-label='Open file in new tab'
      :href='`${entry.url}?inline`'
      target='_blank'
      class='ghost-ext h-auto!'
    >
      <icon-arrow-square-out />
    </a>
    <Button
      aria-label='Close file preview'
      variant='ghost'
      class='ghost-ext h-auto!'
      @click='async () => await $event_bus.emit("hide_dialog")'
    >
      <icon-x />
    </Button>
  </div>
</template>

<script setup lang='ts'>
import { set } from '@vueuse/core';
import { ref, watch } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { useIsMobile } from 'composables/is_mobile.ts';
import { useStore } from 'stores/global.ts';

import type { Entry } from 'types/entry.d.ts';

const props = defineProps<{
  entry: Entry;
}>();

const $event_bus = useEventBus();
const $is_mobile = useIsMobile();
const $store = useStore();

const entry = ref<Entry>(props.entry);

watch(() => props.entry, (new_value) => {
  set(entry, new_value);
});
</script>

<style>
@reference '../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__header {
      & .preview-dialog__actions {
        @apply grow-0 shrink w-fit flex flex-row flex-nowrap items-center justify-end gap-1 sm:gap-0
               bg-background border-b border-l border-zinc-300 dark:border-zinc-800 relative z-[1010];

        & svg.icon {
          @apply size-7 sm:size-6;
        }

        & a,
        & button {
          @apply dark:text-muted-foreground dark:hover:text-primary;
        }
      }
    }
  }
}
</style>
