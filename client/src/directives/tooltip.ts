import { useElementHover } from '@vueuse/core';
import { watch } from 'vue';

import { useStore } from 'stores/global.ts';

import type { Directive, DirectiveBinding } from 'vue';

export const tooltip = {
  mounted(el: HTMLElement, binding: Readonly<DirectiveBinding>, vnode): void {
    const $store = useStore();
    const is_hovered = useElementHover(el);
    watch(is_hovered, (now_hovered) => {
      if (now_hovered) {
        $store.tooltip_trigger = el;
        $store.tooltip_content = binding.value;
        console.log(binding);
        console.log(vnode);
        // $store.tooltip_trigger.classList.remove('hidden');
        // $store.tooltip_trigger.classList.add('block');
      } else {
        // $store.tooltip_trigger?.classList.add('hidden');
        // $store.tooltip_trigger?.classList.remove('block');
        $store.tooltip_trigger = undefined;
        $store.tooltip_content = undefined;
      }
    });
  },

  unmounted(): void {
    const $store = useStore();
    // $store.tooltip_trigger?.classList.add('hidden');
    // $store.tooltip_trigger?.classList.remove('block');
    $store.tooltip_trigger = undefined;
    $store.tooltip_content = undefined;
  },
} as Directive;

export default { tooltip };
