<template>
  <PreviewDialog
    ref='preview'
    class_actions='preview-dialog__actions--text'
    :class_content='[
      "preview-dialog__content--text",
      text_body ? "border" : "",
    ].join(" ")'
    class_wrapper='preview-dialog__wrapper--text'
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
      <div
        v-if='text_body'
        v-text='text_body'
      />
      <object
        v-else-if='use_fallback'
        :data='entry.url'
      />
    </template>
  </PreviewDialog>
</template>

<script setup lang='ts'>
import { set } from '@vueuse/core';
import { onMounted, ref, useTemplateRef } from 'vue';

import { http } from 'lib/http.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const use_fallback = ref<boolean>(false);
const preview = useTemplateRef('preview');
const text_body = ref<string>();

onMounted(async () => {
  try {
    const text = await http.get(entry.url);
    set(text_body, text.data);
  } catch (err) {
    console.log(err);
    set(use_fallback, true);
  }
});
</script>

<style>
@reference '../../../assets/styles/index.css';

.preview-dialog__wrapper--text {
  @apply h-[90%] w-[90%];

  & .preview-dialog__actions--text {
    @apply pt-0;
  }

  & .preview-dialog__content--text {
    @apply grow shrink w-full h-full bg-accent text-primary overflow-hidden;

    & div,
    & object {
      @apply w-full h-full overflow-auto;
    }

    & div {
      @apply wrap-normal p-4;
      white-space: pre-wrap;
      white-space: preserve;
    }
  }
}
</style>
