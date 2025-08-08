import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useStore = defineStore('global', () => {
  const toolbar_height = ref<number>(0);

  return {
    /*-- State --*/
    toolbar_height,
  };
});
