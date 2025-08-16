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
      <audio
        :src='entry.url'
        controls
        class='max-w-full max-h-full w-full h-auto object-contain'
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
