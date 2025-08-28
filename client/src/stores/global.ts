import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useStore = defineStore('global', () => {
  const preview_bg_enabled = ref<boolean>(false);
  const toolbar_height = ref<number>(0);

  return {
    /*-- State --*/
    preview_bg_enabled,
    toolbar_height,
  };
});
