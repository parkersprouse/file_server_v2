<template>
  <ContextMenuItem @select='onSelect'>
    <icon-link />
    Copy Link
  </ContextMenuItem>
</template>

<script setup lang='ts'>
import { useEventBus } from 'composables/event_bus.ts';
import { buildEntryLink } from 'lib/entry_helpers.ts';
import { copyText } from 'lib/utils.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $event_bus = useEventBus();

async function onSelect(): Promise<void> {
  const copied = await copyText(buildEntryLink(entry));
  $event_bus.emit('link_copied', copied);
}
</script>
