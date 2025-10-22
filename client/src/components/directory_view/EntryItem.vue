<template>
  <component
    :is='isDir(entry) ? DirEntry : FileEntry'
    :entry='entry'
    ref='entry'
  >
    <template #default>
      <slot name='default' />
    </template>
  </component>
</template>

<script setup lang='ts'>
import DirEntry from 'components/directory_view/DirEntry.vue';
import FileEntry from 'components/directory_view/FileEntry.vue';
import { isDir } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
  thumbnail?: string;
}>();
</script>
