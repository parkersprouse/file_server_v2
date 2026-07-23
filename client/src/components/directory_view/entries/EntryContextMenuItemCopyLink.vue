<template>
  <ContextMenuItem @select='(_) => $copy()'>
    <icon-link />
    Copy Link
  </ContextMenuItem>
</template>

<script setup lang='ts'>
import { useCopyLink } from 'composables/copy_link.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $copy = useCopyLink(entry);
</script>
