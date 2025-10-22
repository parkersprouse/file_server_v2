<template>
  <div class='entries--grid'>
    <EntryItem
      v-for='entry in entries'
      :key='encodeURI(entry.path)'
      :entry='entry'
    >
      <RowItem
        :entry='entry'
        :thumbnail='getThumbnail(entry)'
      />
    </EntryItem>
  </div>
</template>

<script setup lang='ts'>
import { FileType } from 'enums/file_type.ts';

import type { Entry } from 'types/entry.d.ts';

const { entries } = defineProps<{
  entries: Entry[];
}>();

function getThumbnail(entry: Entry): string | undefined {
  if ([FileType.IMAGE].includes(entry.file_type)) {
    return entry.url;
  }
}
</script>

<style>
@reference '../../../assets/styles/index.css';


</style>
