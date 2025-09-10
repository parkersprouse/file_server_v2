import gh_dark_theme from '@shikijs/themes/github-dark-dimmed';
import gh_light_theme from '@shikijs/themes/github-light';
import { set } from '@vueuse/core';
import { defineStore } from 'pinia';
import { createHighlighter } from 'shiki';
import { onMounted, ref } from 'vue';

import type { Highlighter } from 'shiki';

export const useStore = defineStore('global', () => {
  const highlighter = ref<Highlighter>();
  const preview_bg_enabled = ref<boolean>(false);
  const toolbar_height = ref<number>(0);

  onMounted(async () => {
    const highlighter_instance = await createHighlighter({
      langs: ['txt'], // Object.keys(bundledLanguages),
      themes: [gh_dark_theme, gh_light_theme],
    });
    set(highlighter, highlighter_instance);
  });

  return {
    /*-- State --*/
    highlighter,
    preview_bg_enabled,
    toolbar_height,
  };
});
