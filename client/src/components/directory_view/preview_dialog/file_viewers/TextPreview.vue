<template>
  <div v-if='text_body'>
    <pre v-text='text_body' />
  </div>
  <object
    v-else-if='use_fallback'
    :data='entry.url'
  />
  <div
    v-else
    class='flex flex-row flex-nowrap justify-center items-center'
  >
    <LoadingIndicator />
  </div>
</template>

<script setup lang='ts'>
import { set } from '@vueuse/core';
import { onMounted, ref } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { http } from 'lib/http.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $event_bus = useEventBus();

const use_fallback = ref<boolean>(false);
const text_body = ref<string>();

onMounted(async () => {
  try {
    const text = await http.get(entry.url);
    set(text_body, text.data);
  } catch {
    await $event_bus.emit('toggle_dialog_content_bg');
    set(use_fallback, true);
  }
});
</script>

<style>
@reference '../../../../assets/styles/index.css';

.preview-dialog--text {
  & .preview-dialog__content {
    @apply h-[90%] w-[90%] bg-accent text-primary overflow-hidden p-0;

    & div,
    & object {
      @apply w-full h-full overflow-auto;
    }

    & div {
      & pre {
        /* @apply wrap-normal whitespace-pre-wrap whitespace-[preseve] */
        @apply font-mono p-4;
      }
    }
  }
}
</style>
