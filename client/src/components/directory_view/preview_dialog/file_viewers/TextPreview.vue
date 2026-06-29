<template>
  <!-- Rendered Markdown view. `rendered_html` is sanitized in `lib/markdown.ts`. -->
  <div
    v-if='show_rendered'
    class='markdown-rendered'
    v-html='rendered_html'
  />

  <!-- Source view, syntax-highlighted by Shiki. `highlighted_html` comes from
       `lib/highlighter`, which escapes all code text and only ever injects
       http(s) links + color swatches, so it is safe to inject here. -->
  <div
    v-else
    class='shiki-wrapper'
  >
    <span
      v-if='language_label'
      class='language-tag'
      aria-hidden='true'
    >
      {{ language_label }}
    </span>
    <div
      class='shiki-host'
      :class='{
        "no-inline-preview": $store.preview_inline_colors_disabled,
        "wrap-lines": $store.wrap_text_preview,
      }'
      v-html='highlighted_html'
    />
  </div>
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { highlightCode } from 'lib/highlighter/index.ts';
import { isMarkdownFile, renderMarkdown } from 'lib/markdown.ts';
import { useStore } from 'stores/global.ts';

import type { UnsubscribeFunction } from 'emittery';
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $event_bus = useEventBus();
const event_unsubs = ref<UnsubscribeFunction[]>([]);
const $store = useStore();

const rendered_html = ref<string>('');
const highlighted_html = ref<string>('');
// The raw file text, fetched once and shared by the rendered + source views.
const source_text = ref<string | null>(null);

const is_markdown = computed<boolean>(() => isMarkdownFile(entry.name));
const show_rendered = computed<boolean>(() => get(is_markdown) && $store.preview_markdown_rendered);
const language_label = computed<string>(() => {
  const lang = $store.file_highlight_result?.language;
  return lang && lang !== 'text' ? lang : '';
});

// Switch between the rendered Markdown view and the highlighted source view.
// The wrap-lines and inline-color toggles are now pure CSS, so they no longer
// require a re-highlight (unlike the old Prism implementation).
watch(show_rendered, async (rendered) => {
  if (rendered) {
    await renderMarkdownView();
  } else {
    await highlightSource();
  }
});

// Fetch the raw file once; subsequent views reuse the cached text.
async function loadSourceText(): Promise<string> {
  const cached = get(source_text);
  if (cached !== null) return cached;

  const response = await fetch(entry.url);
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
  const text = await response.text();
  set(source_text, text);
  return text;
}

async function copyText(): Promise<void> {
  try {
    await navigator.clipboard.writeText(await loadSourceText());
    await $event_bus.emit('text_copied', true);
  } catch {
    await $event_bus.emit('text_copied', false);
  }
}

// Render the file into sanitized HTML for the rendered Markdown view.
async function renderMarkdownView(): Promise<void> {
  try {
    set(rendered_html, await renderMarkdown(await loadSourceText()));
  } catch {
    set(rendered_html, '<p class="markdown-rendered__error">Unable to load preview.</p>');
  }
}

// Highlight the file with Shiki and publish the result so the action bar can
// show the source-only controls (and the inline-colors toggle when relevant).
async function highlightSource(): Promise<void> {
  try {
    const result = await highlightCode(await loadSourceText(), entry.name);
    set(highlighted_html, result.html);
    $store.file_highlight_result = {
      inline_colors_present: result.inline_colors_present,
      language: result.language,
    };
  } catch {
    set(highlighted_html, '<p class="shiki-host__error">Unable to load preview.</p>');
    $store.file_highlight_result = undefined;
  }
}

onMounted(async () => {
  const unsubCopyText = $event_bus.on('copy_text', copyText);
  get(event_unsubs).push(unsubCopyText);

  if (get(show_rendered)) {
    await renderMarkdownView();
  } else {
    await highlightSource();
  }
});

onUnmounted(() => {
  // Clear the highlight result so a stale language/inline-color flag can't leak
  // into the next previewed file before it finishes highlighting.
  $store.file_highlight_result = undefined;

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

    & .shiki-wrapper {
      @apply relative h-full w-full;
    }

    & .language-tag {
      @apply absolute top-1 right-3 z-10 select-none pointer-events-none text-muted-foreground;

      font-family: var(--base-font-family);
      line-height: 1;
      opacity: 0.6;
    }

    & .shiki-host {
      @apply h-full w-full overflow-auto;

      &.no-inline-preview .inline-color-wrapper {
        @apply hidden;
      }

      & .shiki {
        @apply m-0 min-h-full w-full p-4;

        font-family: var(--text-preview-font-family);
      }

      &.wrap-lines .shiki code {
        @apply w-full max-w-full whitespace-pre-wrap;

        overflow-wrap: break-word;
      }

      & .shiki-host__error {
        @apply p-6 italic text-muted-foreground;
      }
    }

    /* Rendered Markdown view. Selectors are intentionally more specific than the
       source rules above so they win without `!important`. `.markdown-rendered`
       and the source `.shiki` subtree are mutually exclusive, so the
       descending-specificity overlap is harmless. */
    /* stylelint-disable no-descending-specificity */
    & .markdown-rendered {
      @apply h-full w-full overflow-auto p-6 sm:p-8 text-primary text-left text-base;

      @variant dark {
        --border: var(--color-zinc-500);
      }

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
        @apply inline min-h-0 min-w-0 rounded px-1.5 py-0.5 text-sm;

        font-family: var(--text-preview-font-family);
        background-color: var(--color-zinc-200, oklch(92% 0.004 286.32deg));

        @variant dark {
          background-color: var(--color-zinc-900, oklch(21% 0.006 285.885deg));
        }
      }

      /* Fenced code blocks */
      & pre {
        @apply my-3 h-auto w-full max-w-full overflow-auto rounded-lg p-4 text-sm;

        font-family: var(--text-preview-font-family);
        background-color: var(--color-zinc-200, oklch(92% 0.004 286.32deg));

        @variant dark {
          background-color: var(--color-zinc-900, oklch(21% 0.006 285.885deg));
        }

        & code {
          @apply block min-h-0 min-w-0 bg-transparent p-0;
        }
      }

      & table {
        @apply my-3 w-full border-collapse text-sm;

        @variant dark {
          --border: var(--color-zinc-700);
        }

        & th,
        & td {
          @apply px-3 py-2 text-left border border-border;
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
