<template>
  <!--
    The actions menu is a sibling of the entry link, not a child: interactive
    elements can't nest, and the button mustn't trigger the link's navigation.
  -->
  <div class='entry-cell'>
    <component
      :is='isDir(entry) ? DirEntry : FileEntry'
      :entry='entry'
    >
      <template #default>
        <slot name='default' />
      </template>
    </component>
    <EntryActionsMenu :entry='entry' />
  </div>
</template>

<script setup lang='ts'>
import DirEntry from '@/components/directory_view/entries/DirEntry.vue';
import FileEntry from '@/components/directory_view/entries/FileEntry.vue';
import { isDir } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
}>();
</script>
