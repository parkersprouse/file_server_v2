<template>
  <PreviewDialog
    ref='preview'
    class_actions='preview-dialog__actions--doc'
    class_content='preview-dialog__content--doc'
    class_wrapper='preview-dialog__wrapper--doc'
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
      <object :data='entry.url' />
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

<style>
@reference '../../../assets/styles/index.css';

.preview-dialog__wrapper--doc {
  @apply h-[90%] w-[90%];

  & .preview-dialog__actions--doc {
    @apply pt-0;
  }

  & .preview-dialog__content--doc {
    @apply grow shrink w-full h-full;

    & object {
      @apply w-full h-full;
    }
  }
}
</style>
