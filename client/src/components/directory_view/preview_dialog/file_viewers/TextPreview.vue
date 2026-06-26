<template>
  <!-- Rendered Markdown view. `rendered_html` is sanitized in `lib/markdown.ts`. -->
  <div
    v-if='show_rendered'
    class='markdown-rendered'
    v-html='rendered_html'
  />

  <!-- Source view (syntax-highlighted by Prism). -->
  <pre
    v-else
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
import { get, set } from '@vueuse/core';
import { computed, nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { isMarkdownFile, renderMarkdown } from 'lib/markdown.ts';
import { ensurePrismLoaded, getPrism } from 'lib/prism.ts';
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
const rendered_html = ref<string>('');

const is_markdown = computed<boolean>(() => isMarkdownFile(entry.name));
const show_rendered = computed<boolean>(() => get(is_markdown) && $store.preview_markdown_rendered);

watch(() => $store.preview_inline_colors_disabled, async () => {
  await refreshTextView();
});
watch(() => $store.wrap_text_preview, async () => {
  await refreshTextView();
});

// Switch between the rendered Markdown view and the Prism source view.
watch(show_rendered, async (rendered) => {
  if (rendered) {
    await renderMarkdownView();
  } else {
    await highlightSource();
  }
});

async function copyText(): Promise<void> {
  const ele = get(text_ele);
  if (!ele) return;
  try {
    await navigator.clipboard.writeText(ele.textContent);
    await $event_bus.emit('text_copied', true);
  } catch {
    await $event_bus.emit('text_copied', false);
  }
}

// Fetch the raw file and render it into sanitized HTML for the rendered view.
async function renderMarkdownView(): Promise<void> {
  try {
    const response = await fetch(entry.url);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
    set(rendered_html, await renderMarkdown(await response.text()));
  } catch {
    set(rendered_html, '<p class="markdown-rendered__error">Unable to load preview.</p>');
  }
}

// Run Prism's file highlighter against the (re-mounted) source <pre>.
async function highlightSource(): Promise<void> {
  await ensurePrismLoaded();
  const prism = getPrism();
  if (!prism) return;
  await nextTick();
  prism.plugins.fileHighlight.highlight();
}

function postHightlightHandler(env: Environment): void {
  if (env.element?.tagName.toLocaleLowerCase() !== 'code') return;

  const code_toolbar = document.querySelector('.code-toolbar');
  const code_ele = code_toolbar?.querySelector('pre code');
  if (code_toolbar && code_ele) {
    $store.file_highlight_result = {
      inline_colors_present: code_toolbar.querySelectorAll('.inline-color').length > 0,
      language: env.language || 'none',
    };
  }
}

async function refreshTextView(): Promise<void> {
  if (get(show_rendered)) return;
  await nextTick();
  const prism = getPrism();
  const ele = document.querySelector('pre code');
  if (ele && prism) {
    prism.highlightElement(ele);
  }
}

onMounted(async () => {
  const unsubCopyText = $event_bus.on('copy_text', copyText);
  get(event_unsubs).push(unsubCopyText);

  // Lazy-load Prism.js when text preview is opened
  await ensurePrismLoaded();
  const prism = getPrism();
  if (!prism) {
    return;
  }

  prism.hooks.add('complete', postHightlightHandler);

  if (get(show_rendered)) {
    await renderMarkdownView();
  } else {
    prism.plugins.fileHighlight.highlight();
  }
});

onUnmounted(() => {
  const prism = getPrism();
  if (prism) {
    // prism's doesn't have a `remove` method for its hooks, so we have to do it manually
    for (const [idx, hook] of (prism.hooks.all.complete?.entries() ?? [])) {
      if (hook.name === postHightlightHandler.name) {
        prism.hooks.all.complete?.splice(idx, 1);
      }
    }
  }

  for (const unsub of get(event_unsubs)) {
    unsub();
  }
});
</script>

<style>
@reference '../../../../assets/styles/index.css';

.preview-dialog--text {
  @apply h-[90%] w-[90%] p-0;

  & .preview-dialog__content {
    @apply max-w-full max-h-full w-full h-full bg-accent text-primary overflow-hidden p-0;

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

    /* Rendered Markdown view. Selectors are intentionally more specific than the
       source `& pre` / `& code` rules above so they win without `!important`.
       `.markdown-rendered` and the source `.line-numbers` <pre> are mutually
       exclusive subtrees, so the descending-specificity overlap is harmless. */
    /* stylelint-disable no-descending-specificity */
    & .markdown-rendered {
      @apply h-full w-full overflow-auto p-6 sm:p-8 text-primary text-left text-base;

      font-family: var(--base-font-family);
      line-height: 1.65;
      overflow-wrap: break-word;

      & > :first-child {
        @apply mt-0;
      }

      & > :last-child {
        @apply mb-0;
      }

      & h1,
      & h2,
      & h3,
      & h4,
      & h5,
      & h6 {
        @apply mt-6 mb-3 font-semibold leading-tight;
      }

      & h1 {
        @apply pb-2 text-3xl border-b border-border;
      }

      & h2 {
        @apply pb-2 text-2xl border-b border-border;
      }

      & h3 {
        @apply text-xl;
      }

      & h4 {
        @apply text-lg;
      }

      & h5 {
        @apply text-base;
      }

      & h6 {
        @apply text-sm text-muted-foreground;
      }

      & p {
        @apply my-3;
      }

      & a {
        @apply text-blue-600 underline underline-offset-2 hover:no-underline dark:text-blue-400;
      }

      & ul,
      & ol {
        @apply my-3 pl-6;
      }

      & ul {
        @apply list-disc;
      }

      & ol {
        @apply list-decimal;
      }

      & li {
        @apply my-1;

        & > ul,
        & > ol {
          @apply my-1;
        }
      }

      & blockquote {
        @apply my-3 pl-4 italic text-muted-foreground border-l-4 border-border;
      }

      & hr {
        @apply my-6 border-t border-border;
      }

      /* Inline code */
      & code {
        @apply inline min-h-0 min-w-0 rounded bg-muted px-1.5 py-0.5 text-sm;

        font-family: var(--text-preview-font-family);
      }

      /* Fenced code blocks */
      & pre {
        @apply my-3 h-auto w-full max-w-full overflow-auto rounded-lg bg-muted p-4 text-sm;

        font-family: var(--text-preview-font-family);

        & code {
          @apply block min-h-0 min-w-0 bg-transparent p-0;
        }
      }

      & table {
        @apply my-3 w-full border-collapse text-sm;

        & th,
        & td {
          @apply px-3 py-2 text-left border border-border;
        }

        & th {
          @apply bg-muted font-semibold;
        }
      }

      & img {
        @apply my-3 h-auto max-w-full rounded;
      }

      & .markdown-rendered__error {
        @apply italic text-muted-foreground;
      }
    }
    /* stylelint-enable no-descending-specificity */
  }
}
</style>
