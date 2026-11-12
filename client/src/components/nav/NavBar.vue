<template>
  <header
    id='toolbar'
    class='h-fit rounded-none border border-x-0 border-t-0 p-0 gap-4 flex items-center
           justify-between z-10 fixed top-0 left-0 right-0'
  >
    <!-- The bookmarks sheet slides in from the left, so its trigger sits there. -->
    <section class='flex items-center self-stretch min-w-0 gap-4'>
      <div class='flex self-stretch shrink-0'>
        <BookmarksSheet />
        <Separator
          orientation='vertical'
          class='h-auto! self-stretch!'
        />
      </div>
      <section ref='breadcrumbs' class='breadcrumb-wrapper scrollbar-hidden'>
        <NavBreadcrumbs :hidden-count='hidden_count' />
      </section>
    </section>

    <!-- mobile view sheet trigger -->
    <section
      v-if='$is_mobile'
      class='flex justify-end items-center h-full'
    >
      <SearchDialog />
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
      <SearchDialog />
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
      <template v-if='install_available'>
        <Separator
          orientation='vertical'
          class='h-auto! self-stretch!'
        />
        <InstallButton />
      </template>
    </section>
  </header>
</template>

<script setup lang='ts'>
import { get, useThrottleFn } from '@vueuse/core';
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

import { useBreadcrumbCollapse } from 'composables/breadcrumb_collapse.ts';
import { useEventBus } from 'composables/event_bus.ts';
import { useIsMobile } from 'composables/is_mobile.ts';
import { usePwaInstall } from 'composables/pwa.ts';
import { useStore } from 'stores/global.ts';

import type { UnsubscribeFunction } from 'emittery';

const $is_mobile = useIsMobile();
const $store = useStore();
const { available: install_available } = usePwaInstall();

const event_unsubs = ref<UnsubscribeFunction[]>([]);
const $event_bus = useEventBus();

const breadcrumbs = useTemplateRef('breadcrumbs');
const { hidden_count, recompute: recomputeBreadcrumbCollapse } = useBreadcrumbCollapse(breadcrumbs);

const onResize = useThrottleFn((entries) => {
  const entry = entries[0];
  const target = entry.target as HTMLElement;
  $store.toolbar_height = target.offsetHeight;
  recomputeBreadcrumbCollapse();
}, 100);

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

  await recomputeBreadcrumbCollapse();
  await nextTick(rightAlignBreadcrumbs);
  get(event_unsubs).push($event_bus.on('path_updated', async () => {
    await recomputeBreadcrumbCollapse();
    rightAlignBreadcrumbs();
  }));
});

onUnmounted(() => {
  observer.disconnect();
  for (const unsub of get(event_unsubs)) unsub();
});
</script>

<style>
@reference '../../assets/styles/index.css';

/*
  `viewport-fit=cover` lets the page run under display cutouts (a phone in
  landscape, or an installed app drawing edge to edge), so the bar's content
  keeps clear of them itself. The insets are 0 everywhere else.
*/
#toolbar {
  padding-right: env(safe-area-inset-right);
  padding-left: env(safe-area-inset-left);
}

.breadcrumb-wrapper {
  @apply block self-center min-w-0 overflow-y-hidden overflow-x-auto;
}

.config-wrapper {
  @apply flex justify-end items-center h-full;
}
</style>
