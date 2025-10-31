<template>
  <Menubar
    id='toolbar'
    class='z-10 fixed top-0 left-0 right-0 h-fit justify-between items-center border-x-0 border-t-0 p-0 pl-4 gap-4'
  >
    <section ref='breadcrumbs' class='breadcrumb-wrapper scrollbar-hidden'>
      <NavBreadcrumbs />
    </section>

    <!-- mobile view sheet trigger -->
    <section
      v-if='$is_mobile'
      class='flex justify-end items-center h-full'
    >
      <MobileSheet />
    </section>

    <!-- desktop view inline elements -->
    <section
      v-else
      class='config-wrapper'
    >
      <Separator
        orientation='vertical'
        class='h-auto! self-stretch!'
      />
      <ViewSelector />
      <Separator
        orientation='vertical'
        class='h-auto! self-stretch!'
      />
      <SortSelector />
      <Separator
        orientation='vertical'
        class='h-auto! self-stretch!'
      />
      <ThemeToggle />
    </section>
  </Menubar>
</template>

<script setup lang='ts'>
import { get, useThrottleFn } from '@vueuse/core';
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { useIsMobile } from 'composables/is_mobile.ts';
import { useStore } from 'stores/global.ts';

import type { UnsubscribeFunction } from 'emittery';

const $is_mobile = useIsMobile();
const $store = useStore();

const onResize = useThrottleFn((entries) => {
  const entry = entries[0];
  const target = entry.target as HTMLElement;
  $store.toolbar_height = target.offsetHeight;
}, 100);

const event_unsubs = ref<UnsubscribeFunction[]>([]);
const $event_bus = useEventBus();

const breadcrumbs = useTemplateRef('breadcrumbs');
const observer = new ResizeObserver((entries) => onResize(entries));

function rightAlignBreadcrumbs(): void {
  const bc = get(breadcrumbs);
  bc?.scrollTo({
    behavior: 'instant',
    left: bc.scrollWidth + 100,
    top: 0,
  });
}

onMounted(async () => {
  const toolbar = document.getElementById('toolbar');
  if (toolbar) observer.observe(toolbar);

  nextTick(rightAlignBreadcrumbs);
  get(event_unsubs).push($event_bus.on('path_updated', rightAlignBreadcrumbs));
});

onUnmounted(() => {
  observer.disconnect();
  for (const unsub of get(event_unsubs)) unsub();
});
</script>

<style>
@reference '../../assets/styles/index.css';

.breadcrumb-wrapper {
  @apply block h-full overflow-y-hidden overflow-x-auto;
}

.config-wrapper {
  @apply flex justify-end items-center h-full;
}
</style>
