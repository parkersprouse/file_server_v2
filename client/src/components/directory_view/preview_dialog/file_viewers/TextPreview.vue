<template>
  <div v-if='text_body'>
    <pre><code
      v-html='text_body'
      class='hljs'
      ref='text_ele'
    /></pre>
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
import hljs from '@highlightjs/cdn-assets/es/highlight.min.js';
import { get, set } from '@vueuse/core';
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { http } from 'lib/http.ts';

import type { UnsubscribeFunction } from 'emittery';
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $event_bus = useEventBus();
const event_unsubs = ref<UnsubscribeFunction[]>([]);

const use_fallback = ref<boolean>(false);
const text_body = ref<string>();
const text_ele = useTemplateRef('text_ele');

async function copyText(): Promise<void> {
  const ele = get(text_ele);
  if (!ele) return;
  await navigator.clipboard.writeText(ele.textContent);
  await $event_bus.emit('text_copied');
}

onMounted(async () => {
  const onCopyText = $event_bus.on('copy_text', copyText);
  get(event_unsubs).push(onCopyText);

  window.hljs = hljs;
  await import('highlightjs-line-numbers.js/dist/highlightjs-line-numbers.min.js');
  window.hljs.initLineNumbersOnLoad();

  try {
    const text = await http.get(entry.url, { responseType: 'text' });
    const language = entry.name.split('.').reverse()[0] ?? 'txt';
    const highlighted = await window.hljs.highlight(text.data, {
      ignoreIllegals: true,
      language,
    });
    set(text_body, highlighted.value);
  } catch (e) {
    console.error(e);
    await $event_bus.emit('toggle_dialog_content_bg');
    set(use_fallback, true);
  }
});

onUnmounted(() => {
  for (const unsub of get(event_unsubs)) unsub();
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
      @apply relative;

      & pre {
        /* @apply wrap-normal whitespace-pre-wrap whitespace-[preseve] */
        @apply font-mono p-0 min-h-full min-w-full;

        & code {
          @apply font-mono p-4 h-full w-full;
        }
      }
    }
  }
}
</style>
