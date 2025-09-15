<template>
  <Button
    ref='preview_title_button'
    variant='ghost'
    class='ghost-ext h-auto!'
    @click='open = !open'
  >
    <icon-info />
  </Button>

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
import { get, onClickOutside, set, useThrottleFn } from '@vueuse/core';
import { onMounted, nextTick, ref, useTemplateRef, onUnmounted } from 'vue';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const open = ref<boolean>(false);
const preview_title = useTemplateRef('preview_title');
const preview_title_button = useTemplateRef('preview_title_button');
const preview_title_wrapper = useTemplateRef('preview_title_wrapper');

onClickOutside(preview_title, async () => {
  await nextTick(() => {
    set(open, false);
  });
}, {
  ignore: [preview_title_button],
});

const onResize = useThrottleFn((entries) => {
  const target = entries[0]!.target as HTMLDivElement;
  get(preview_title_wrapper)!.style.top = `calc(${target.offsetHeight}px + 0.5rem)`;
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
        @apply absolute max-w-screen w-screen px-4;

        & .preview-dialog__title--compact {
          @apply bg-background border border-zinc-300 dark:border-zinc-800 text-sm!
                 flex flex-nowrap flex-row gap-2 items-center justify-center
                 max-w-full p-1 px-2 py-1 text-foreground! w-full whitespace-pre-line text-center;
        }
      }
    }
  }
}
</style>
