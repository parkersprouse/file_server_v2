<template>
  <img :src='entry.url'>
</template>

<script setup lang='ts'>
import { get } from '@vueuse/core';
import { computed, h, resolveComponent, withModifiers } from 'vue';

import { useStore } from 'stores/global.ts';

import type { Entry } from 'types/entry.d.ts';
import type { FileTypeAttrs } from 'types/file_type_attrs.d.ts';
import type { ComputedRef } from 'vue';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $store = useStore();

const attributes: ComputedRef<FileTypeAttrs> = computed(() => ({
  actions: {
    start: h(
      'Button',
      {
        'aria-label': 'Invert colors',
        class: 'ghost-ext h-auto! p-1!',
        onClick: withModifiers(() => {
          $store.img_mask_inverted = !$store.img_mask_inverted;
        }, ['prevent']),
        variant: 'ghost',
      },
      h(resolveComponent('icon-circle-half')),
    ),
  },
  content: {
    bindings: {
      entry: get(entry),
    },
    class: [
      get(entry)?.name.endsWith('svg') ? 'preview-dialog__content--svg' : '',
      $store.img_mask_inverted ? 'invert' : '',
    ].join(' '),
  },
  wrapper: {
    class: get(entry)?.name.endsWith('svg') ? 'preview-dialog__wrapper--svg' : '',
  },
}));

defineExpose({
  attributes,
});
</script>

<style>
@reference '../../../../assets/styles/index.css';

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
