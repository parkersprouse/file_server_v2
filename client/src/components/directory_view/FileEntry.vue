<template>
  <ContextMenu>
    <ContextMenuTrigger class='contents'>
      <a
        v-if='can_preview'
        href='#'
        class='entry'
        @click.prevent='async () => await $event_bus.emit("show_dialog", entry)'
      >
        <slot name='default' />
      </a>
      <a
        v-else
        :href='entry.url'
        download
        class='entry'
      >
        <slot name='default' />
      </a>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <ContextMenuItem
        as='a'
        :href='`${entry.url}?inline`'
        target='_blank'
      >
        <icon-arrow-square-out />
        Open in New Tab
      </ContextMenuItem>
      <ContextMenuItem
        as='a'
        :href='`${entry.url}?download`'
        download
      >
        <icon-download-simple />
        Download
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script setup lang='ts'>
import { computed } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $event_bus = useEventBus();

const can_preview = computed<boolean>(() => Boolean(entry.preview_type));
</script>
