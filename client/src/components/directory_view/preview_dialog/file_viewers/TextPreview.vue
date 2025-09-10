<template>
  <div
    v-if='text_body'
    v-html='text_body'
  />
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
import gh_dark_theme from '@shikijs/themes/github-dark-dimmed';
import gh_light_theme from '@shikijs/themes/github-light';
import { get, set } from '@vueuse/core';
import { onMounted, ref } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { useDark } from 'composables/theme.ts';
import { http } from 'lib/http.ts';
import { useStore } from 'stores/global.ts';

import type { BundledLanguage } from 'shiki';
import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $event_bus = useEventBus();
const $is_dark = useDark();
const $store = useStore();

const use_fallback = ref<boolean>(false);
const text_body = ref();

onMounted(async () => {
  try {
    const highlighter = get($store.highlighter);
    const text = await http.get(entry.url, {
      responseType: 'text',
    });
    const { data } = text;

    if (highlighter) {
      const lang = entry.name.split('.').reverse()[0] ?? 'txt';
      if (!highlighter.getLoadedLanguages().includes(lang)) {
        console.log('loading', lang);
        await highlighter.loadLanguage(lang as BundledLanguage);
      }

      const output = highlighter.codeToHtml(data, {
        lang,
        structure: 'classic',
        theme: $is_dark ? gh_dark_theme : gh_light_theme,
      });
      set(text_body, output);
    } else {
      set(text_body, `<pre><code>${text.data}</code></pre>`);
    }
  } catch (e) {
    console.error(e);
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
        @apply font-mono p-4 min-h-full min-w-full;
      }
    }
  }
}
</style>
