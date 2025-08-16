<template>
  <ContextMenu v-if='Boolean(component_type)'>
    <ContextMenuTrigger class='contents'>
      <component
        :is='component_type'
        :entry='entry'
      >
        <slot name='default' />
      </component>
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
  <a
    v-else
    :href='entry.url'
    download
    class='entry'
  >
    <slot name='default' />
  </a>
</template>

<script setup lang='ts'>
import { get } from '@vueuse/core';
import { computed, ref } from 'vue';

import AudioViewer from 'components/directory_view/file_viewers/AudioViewer.vue';
import DocumentViewer from 'components/directory_view/file_viewers/DocumentViewer.vue';
import ImageViewer from 'components/directory_view/file_viewers/ImageViewer.vue';
import TextViewer from 'components/directory_view/file_viewers/TextViewer.vue';
import VideoViewer from 'components/directory_view/file_viewers/VideoViewer.vue';
import { FileType } from 'enums/file_type.ts';

import type { Entry } from 'types/entry.d.ts';
import type { Component } from 'vue';

const { entry } = defineProps<{
  entry: Entry;
}>();

const type_component_mapping = ref<{ [index: string]: Component; }>({
  [FileType.AUDIO]: AudioViewer,
  [FileType.DOCUMENT]: DocumentViewer,
  [FileType.IMAGE]: ImageViewer,
  [FileType.SPREADSHEET]: DocumentViewer,
  [FileType.TEXT]: TextViewer,
  [FileType.VIDEO]: VideoViewer,
});

const component_type = computed<Component>(() => get(type_component_mapping)[entry.file_type]);
</script>
