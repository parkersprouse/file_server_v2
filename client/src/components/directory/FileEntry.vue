<template>
  <ImageViewer
    v-if='isType(entry, FileType.IMAGE)'
    :entry='entry'
  >
    <slot name='default' />
  </ImageViewer>
  <VideoViewer
    v-else-if='isType(entry, FileType.VIDEO)'
    :entry='entry'
  >
    <slot name='default' />
  </VideoViewer>
  <AudioViewer
    v-else-if='isType(entry, FileType.AUDIO)'
    :entry='entry'
  >
    <slot name='default' />
  </AudioViewer>
  <DocumentViewer
    v-else-if='isType(entry, [FileType.DOCUMENT, FileType.SPREADSHEET])'
    :entry='entry'
  >
    <slot name='default' />
  </DocumentViewer>
  <TextViewer
    v-else-if='isType(entry, FileType.TEXT)'
    :entry='entry'
  >
    <slot name='default' />
  </TextViewer>
  <a
    v-else
    :href='toFileUrl(entry)'
    download
    class='entry'
  >
    <slot name='default' />
  </a>
</template>

<script setup lang='ts'>
import { FileType } from 'enums/file_type.ts';
import { toFileUrl } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
}>();

function isType(entry: Entry, type: FileType | FileType[]): boolean {
  if (Array.isArray(type)) return type.includes(entry.file_type);
  return entry.file_type === type;
}
</script>
