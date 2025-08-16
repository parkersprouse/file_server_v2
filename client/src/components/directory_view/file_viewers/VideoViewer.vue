<template>
  <PreviewDialog
    ref='preview'
    :entry='entry'
  >
    <template #trigger>
      <a
        href='#'
        class='entry'
        @click.prevent='preview?.open()'
      >
        <slot name='default' />
      </a>
    </template>
    <template #default>
      <video
        :src='entry.url'
        controls
      />
    </template>
  </PreviewDialog>
</template>

<script setup lang='ts'>
import { useTemplateRef } from 'vue';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const preview = useTemplateRef('preview');
</script>
