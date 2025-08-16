<template>
  <PreviewDialog
    ref='preview'
    :class_content='class_content'
    :class_wrapper='is_svg ? "preview-dialog__wrapper--svg" : ""'
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
    <template #actions_start>
      <Button
        aria-label='Invert colors'
        variant='ghost'
        class='ghost-ext h-auto! p-1!'
        @click='invert_colors = !invert_colors'
      >
        <!-- <icon-checkerboard /> -->
        <icon-circle-half />
      </Button>
    </template>
    <template #default>
      <img :src='entry.url'>
    </template>
  </PreviewDialog>
</template>

<script setup lang='ts'>
import { get } from '@vueuse/core';
import { computed, useTemplateRef } from 'vue';

import { useStore } from 'stores/global.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $store = useStore();

const preview = useTemplateRef('preview');

const class_content = computed<string>(() => ([
  get(invert_colors) ? 'invert' : '',
  get(is_svg) ? 'preview-dialog__content--svg' : '',
].join(' ')));

const is_svg = computed<boolean>(() => entry.name.endsWith('svg'));

const invert_colors = computed<boolean>({
  get: () => $store.img_mask_inverted,
  set: (new_value) => { $store.img_mask_inverted = new_value; },
});
</script>

<style>
@reference '../../../assets/styles/index.css';

.preview-dialog__wrapper--svg {
  @apply h-full w-full;

  & .preview-dialog__content--svg {
    @apply grow shrink;

    & img {
      @apply w-full h-full;
    }
  }
}
</style>
