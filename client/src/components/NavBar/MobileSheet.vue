<template>
  <Drawer @update:open='async (open: boolean) => !open && await get(sort_toggle)?.commit()'>
    <DrawerTrigger as-child>
      <Button
        variant='ghost'
        class='p-1! h-auto ghost-ext'
      >
        <icon-list class='size-8!' />
      </Button>
    </DrawerTrigger>
    <DrawerContent class='border-t border-muted'>
      <DrawerHeader>
        <VisuallyHidden>
          <DrawerTitle>
            Settings
          </DrawerTitle>
          <DrawerDescription>
            Settings menu
          </DrawerDescription>
        </VisuallyHidden>
      </DrawerHeader>
      <section class='flex flex-col flex-nowrap justify-evenly items-center h-full px-4 pb-4'>
        <p class='flex flex-row flex-nowrap justify-between items-center gap-2 w-full px-0 pt-0 pb-2'>
          <span class='shrink-0 grow-0 text-lg text-muted-foreground font-semibold'>
            Layout
          </span>
          <Separator
            orientation='horizontal'
            class='shrink-0 grow w-auto!'
          />
        </p>
        <ViewToggles />

        <p class='flex flex-row flex-nowrap justify-between items-center gap-2 w-full px-0 py-2'>
          <span class='shrink-0 grow-0 text-lg text-muted-foreground font-semibold'>
            Sort
          </span>
          <Separator
            orientation='horizontal'
            class='shrink-0 grow w-auto!'
          />
        </p>
        <SortToggles ref='sort_toggle' />

        <p class='flex flex-row flex-nowrap justify-between items-center gap-2 w-full px-0 py-2'>
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
    </DrawerContent>
  </Drawer>
</template>

<script setup lang='ts'>
import { get } from '@vueuse/core';
import { VisuallyHidden } from 'reka-ui';
import { useTemplateRef } from 'vue';

import type SortToggles from 'components/navbar/SortToggles.vue';

const sort_toggle = useTemplateRef<typeof SortToggles>('sort_toggle');
</script>
