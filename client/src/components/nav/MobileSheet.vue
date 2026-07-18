<template>
  <Sheet @update:open='async (open: boolean) => await onOpenUpdated(open)'>
    <SheetTrigger as-child>
      <Button
        variant='ghost'
        aria-label='Open settings'
        class='p-1! h-auto ghost-ext'
      >
        <icon-list aria-hidden='true' class='size-8!' />
      </Button>
    </SheetTrigger>
    <SheetContent
      class='data-[side=right]:w-full'
      side='right'
      :show-close-button='false'
    >
      <SheetClose as-child>
        <Button
          variant='ghost'
          class='absolute top-4 right-4 p-1 size-fit'
          size='icon-sm'
        >
          <PhX class='size-6' />
          <VisuallyHidden>
            <span>Close</span>
          </VisuallyHidden>
        </Button>
      </SheetClose>

      <SheetHeader class='pt-8 px-0 pb-0'>
        <SheetTitle class='px-4'>
          Settings
        </SheetTitle>
        <VisuallyHidden>
          <SheetDescription>
            Settings menu
          </SheetDescription>
        </VisuallyHidden>
      </SheetHeader>

      <section class='navbar--mobile__actions'>
        <section class='navbar--mobile__actions__section'>
          <p class='navbar--mobile__actions__section__header'>
            <span class='shrink-0 grow-0 text-lg text-muted-foreground font-semibold'>
              Layout
            </span>
            <Separator
              orientation='horizontal'
              class='shrink-0 grow w-auto!'
            />
          </p>
          <ViewToggles />
        </section>

        <section class='navbar--mobile__actions__section'>
          <p class='navbar--mobile__actions__section__header'>
            <span class='shrink-0 grow-0 text-lg text-muted-foreground font-semibold'>
              Sort
            </span>
            <Separator
              orientation='horizontal'
              class='shrink-0 grow w-auto!'
            />
          </p>
          <SortToggles ref='sort_toggle' />
        </section>

        <section class='navbar--mobile__actions__section'>
          <p class='navbar--mobile__actions__section__header'>
            <span class='shrink-0 grow-0 text-lg text-muted-foreground font-semibold'>
              Theme
            </span>
            <Separator
              orientation='horizontal'
              class='shrink-0 grow w-auto!'
            />
          </p>
          <ThemeToggle />
        </section>
      </section>
    </SheetContent>
  </Sheet>
</template>

<script setup lang='ts'>
import PhX from '~icons/ph/x';

import { get } from '@vueuse/core';
import { VisuallyHidden } from 'reka-ui';
import { useTemplateRef } from 'vue';

import type SortToggles from 'components/nav/SortToggles.vue';

const sort_toggle = useTemplateRef<typeof SortToggles>('sort_toggle');

async function onOpenUpdated(open: boolean): Promise<void> {
  if (!open) await get(sort_toggle)?.commit();
}
</script>

<style>
@reference '../../assets/styles/index.css';

.navbar--mobile__actions {
  @apply flex flex-col flex-nowrap justify-start items-center gap-10 h-full px-6 pb-6 pt-10
         overflow-x-hidden overflow-y-auto;

  & .navbar--mobile__actions__section {
    @apply w-full flex flex-col flex-nowrap justify-start items-center;

    & .navbar--mobile__actions__section__header {
      @apply flex flex-row flex-nowrap justify-between items-center gap-2 w-full px-0 py-2;
    }
  }

  & .ghost-ext {
    @apply p-2.5;
  }
}
</style>
