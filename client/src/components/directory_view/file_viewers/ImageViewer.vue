<template>
  <PreviewDialog
    ref='preview'
    :entry='entry'
  >
    <template #trigger>
      <a
        href='#'
        class='entry'
        @click='preview?.open()'
      >
        <slot name='default' />
      </a>
    </template>
    <template #default>
      <img :src='toFileUrl(entry)'>
    </template>
  </PreviewDialog>
</template>

<script setup lang='ts'>
import { useTemplateRef } from 'vue';

import { toFileUrl } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const preview = useTemplateRef('preview');
</script>
