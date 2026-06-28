<template>
  <div
    ref='preview_title_wrapper'
    class='preview-dialog__title__wrapper'
    :class='{
      hidden: !open,
    }'
  >
    <Badge
      ref='preview_title'
      variant='outline'
      class='preview-dialog__title--compact'
    >
      <icon-tag class='size-4! shrink-0!' />
      {{ entry.name }}
    </Badge>
  </div>
</template>

<script setup lang='ts'>
import { get, set, useThrottleFn } from '@vueuse/core';
import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef } from 'vue';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

defineExpose({
  is_open: computed(() => get(open)),
  toggleInfo: () => set(open, !get(open)),
});

const open = shallowRef<boolean>(false);
const preview_title_wrapper = useTemplateRef('preview_title_wrapper');

const onResize = useThrottleFn((entries) => {
  const target = entries[0]!.target as HTMLDivElement;
  get(preview_title_wrapper)!.style.top = `calc(${target.offsetHeight}px - 1px)`;
}, 100);

const observer = new ResizeObserver(onResize);

onMounted(async () => {
  const actions: HTMLDivElement | null = document.querySelector('.preview-dialog__actions');
  if (actions && get(preview_title_wrapper)) {
    observer.observe(actions);
  }
});

onUnmounted(() => {
  observer.disconnect();
});
</script>

<style>
@reference '../../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__header {
      & .preview-dialog__title__wrapper {
        @apply border-none absolute max-w-full w-full; /* px-4 */

        & .preview-dialog__title--compact {
          @apply bg-background border-x-0 border-y text-sm!
                 flex flex-nowrap flex-row gap-2 items-center justify-center
                 max-w-full px-2 py-1 text-foreground! w-full whitespace-pre-line text-center;
        }
      }
    }
  }
}
</style>
