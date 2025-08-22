<template>
  <div
    ref='dialog_actions'
    class='preview-dialog__actions'
  >
    <Button
      v-if='is_image'
      variant='ghost'
      aria-label='Invert colors'
      class='ghost-ext h-auto! p-1!'
      @click.prevent='() => { $store.img_mask_inverted = !$store.img_mask_inverted; }'
    >
      <icon-circle-half />
    </Button>
    <a
      aria-label='Download file'
      :href='`${entry.url}?download`'
      download
      class='ghost-ext h-auto! p-1!'
    >
      <icon-download-simple />
    </a>
    <a
      aria-label='Open file in new tab'
      :href='`${entry.url}?inline`'
      target='_blank'
      class='ghost-ext h-auto! p-1!'
    >
      <icon-arrow-square-out />
    </a>
    <Button
      aria-label='Close file preview'
      variant='ghost'
      class='ghost-ext h-auto! p-1!'
      @click='async () => await $event_bus.emit("hide_dialog")'
    >
      <icon-x />
    </Button>
  </div>
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { computed, ref, watch } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { FileType } from 'enums/file_type.ts';
import { useStore } from 'stores/global.ts';

import type { Entry } from 'types/entry.d.ts';

const props = defineProps<{
  entry: Entry;
}>();

const $event_bus = useEventBus();
const $store = useStore();

const entry = ref<Entry>(props.entry);

const is_image = computed<boolean>(() => get(entry).file_type === FileType.IMAGE);

watch(() => props.entry, (new_value) => {
  set(entry, new_value);
});
</script>

<style>
@reference '../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__actions {
      @apply flex flex-row flex-nowrap items-center justify-center
              gap-1 sm:gap-0 absolute right-0 top-0 bg-background
              border-l border-b border-zinc-300 dark:border-zinc-700;

      & svg.icon {
        @apply size-7 sm:size-6;
      }

      & a,
      & button {
        @apply text-muted-foreground;

        @variant hover {
          @apply text-primary;
        }
      }
    }
  }
}
</style>
