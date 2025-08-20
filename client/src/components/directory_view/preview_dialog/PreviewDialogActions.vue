<template>
  <div
    ref='dialog_actions'
    :class='cn("preview-dialog__actions", props.class)'
  >
    <slot name='actions_start' />
    <a
      aria-label='Download file'
      :href='`${props.entry.url}?download`'
      download
      class='ghost-ext h-auto! p-1!'
    >
      <icon-download-simple />
    </a>
    <a
      aria-label='Open file in new tab'
      :href='`${props.entry.url}?inline`'
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
    <slot name='actions_end' />
  </div>
</template>

<script setup lang='ts'>
import { useEventBus } from 'composables/event_bus.ts';
import { cn } from 'lib/utils.ts';

import type { Entry } from 'types/entry.d.ts';
import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
  entry: Entry;
}>();

const $event_bus = useEventBus();
</script>
