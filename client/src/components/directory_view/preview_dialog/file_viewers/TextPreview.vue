<template>
  <pre
    :data-src='entry.url'
    ref='text_ele'
    class='line-numbers'
    :class='{
      "no-inline-preview": $store.preview_inline_colors_disabled,
      "wrap-lines": $store.wrap_text_preview,
    }'
  />
</template>

<script setup lang='ts'>
import { get } from '@vueuse/core';
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { capitalize } from 'lib/utils.ts';
import { useStore } from 'stores/global.ts';

import type { UnsubscribeFunction } from 'emittery';
import type { Environment } from 'prismjs';
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $event_bus = useEventBus();
const event_unsubs = ref<UnsubscribeFunction[]>([]);
const $store = useStore();

const text_ele = useTemplateRef('text_ele');
// const highlighter = ref<Worker>();

watch(() => $store.preview_inline_colors_disabled, async () => {
  await nextTick();
  const ele = document.querySelector('pre code');
  if (ele) window.Prism.highlightElement(ele);
});

watch(() => $store.wrap_text_preview, async () => {
  await nextTick();
  const ele = document.querySelector('pre code');
  if (ele) window.Prism.highlightElement(ele);
});

async function copyText(): Promise<void> {
  const ele = get(text_ele);
  if (!ele) return;
  await navigator.clipboard.writeText(ele.textContent);
  await $event_bus.emit('text_copied');
}

function postHightlightHandler(env: Environment): void {
  if (env.element?.tagName.toLocaleLowerCase() !== 'code') return;

  const code_toolbar = document.querySelector('.code-toolbar');
  const code_ele = code_toolbar?.querySelector('pre code');
  if (code_toolbar && code_ele) {
    const language_tag = code_toolbar.querySelector('.language-tag');
    if (language_tag) language_tag.textContent = capitalize(language_tag.textContent, false);

    $store.file_highlight_result = {
      inline_colors_present: code_toolbar.querySelectorAll('.inline-color').length > 0,
      language: env.language || 'none',
    };
  }
}

onMounted(() => {
  const unsubCopyText = $event_bus.on('copy_text', copyText);
  get(event_unsubs).push(unsubCopyText);

  window.Prism.hooks.add('complete', postHightlightHandler);
  window.Prism.plugins.fileHighlight.highlight();

  /*
   * https://github.com/PrismJS/prism/issues/1059#issuecomment-261703318
   * https://github.com/PrismJS/prism/blob/025147106e82b6efa92ba947cc06cc1a838f477b/components/prism-core.js#L465-L473
  const worker = new Highlighter();
  const worker = new Worker(new URL('../../../../vendor/prism/prism.min.js', import.meta.url));
  set(highlighter, worker);


  // eslint-disable-next-line unicorn/prefer-add-event-listener -- temp
  worker.onmessage = (resp: MessageEvent): void => {
    console.log(resp.data);
  };
  worker.postMessage('run');
  */
});

onUnmounted(() => {
  // prism's doesn't have a `remove` method for its hooks, so we have to do it manually
  for (const [idx, hook] of (window.Prism.hooks.all.complete?.entries() ?? [])) {
    if (hook.name === postHightlightHandler.name) {
      window.Prism.hooks.all.complete?.splice(idx, 1);
    }
  }

  for (const unsub of get(event_unsubs)) unsub();

  // get(highlighter)?.terminate();
});
</script>

<style>
@reference '../../../../assets/styles/index.css';

.preview-dialog--text {
  & .preview-dialog__content {
    @apply h-[90%] w-[90%] bg-accent text-primary overflow-hidden p-0;

    & object {
      @apply w-full h-full overflow-auto;
    }

    & .code-toolbar {
      @apply w-full h-full;

      & .toolbar {
        @apply opacity-100 top-1 right-2;

        line-height: 1;

        & .toolbar-item {
          @apply m-0! p-0!;

          & .language-tag {
            @apply bg-transparent border-none border-0 shadow-none
                   hover:bg-transparent hover:border-none hover:border-0 hover:shadow-none
                   cursor-default select-none pointer-events-none p-0;

            /* font-family: var(--text-preview-font-family); */
            font-family: var(--base-font-family);
            color: var(--syntax-fg) !important;
            opacity: 0.5;
          }
        }
      }
    }

    & pre {
      @apply h-full w-full m-0;
      font-family: var(--text-preview-font-family);

      &.no-inline-preview {
        & .inline-color-wrapper {
          @apply hidden;
        }
      }

      & code {
        @apply min-h-full min-w-full inline-block;
        font-family: var(--text-preview-font-family);
      }

      &.wrap-lines {
        @apply max-w-full whitespace-pre-wrap;
        overflow-wrap: break-word;

        & code {
          @apply max-w-full;
          overflow-wrap: inherit;
          white-space: inherit;
        }
      }
    }
  }
}
</style>
