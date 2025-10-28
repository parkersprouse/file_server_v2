<template>
  <Item variant='outline'>
    <ItemMedia
      v-if='entry.thumbnail && heic_check'
      variant='image'
    >
      <img
        :src='entry.thumbnail'
        class='object-contain! aspect-square!'
      >
    </ItemMedia>
    <ItemMedia v-else>
      <component :is='fileTypeToIcon(entry.file_type || entry.entry_type)' />
    </ItemMedia>
    <ItemContent class='w-auto overflow-hidden'>
      <ItemTitle class='w-full block text-nowrap whitespace-nowrap text-ellipsis
                        overflow-y-hidden overflow-x-scroll scrollbar-hidden'
      >
        {{ entry.name }}
      </ItemTitle>
      <ItemDescription>
        <div class='flex flex-row flex-nowrap justify-start items-center w-full gap-2 text-muted-foreground'>
          <Tooltip
            :delay-duration='500'
            :disable-closing-trigger='true'
            :disable-hoverable-content='true'
            :skip-delay-duration='300'
          >
            <TooltipTrigger as-child>
              <Badge
                variant='outline'
                class='entry-meta entry-meta__last-modified'
              >
                <icon-clock-counter-clockwise />
                {{ relative(entry.last_modified_at) }}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <div class='text-center'>
                Last modified on
                <br>
                {{ absolute(entry.last_modified_at) }}
              </div>
            </TooltipContent>
          </Tooltip>
          <template v-if='Boolean(entry.duration)'>
            <Badge
              variant='outline'
              class='entry-meta entry-meta__duration'
            >
              <icon-timer />
              {{ entry.duration }}
            </Badge>
          </template>
        </div>
      </ItemDescription>
    </ItemContent>
  </Item>
</template>

<script setup lang='ts'>
import { inject } from 'vue';

import { absolute, relative } from 'lib/datetime.ts';
import { fileTypeToIcon } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
}>();

const heic_check = inject<boolean>('heic_check', false);
</script>

<style>
@reference '../../../assets/styles/index.css';

.entries--row {
  & .entry {
    @apply z-10 hover:z-20;

    &:nth-child(odd) {
      @apply bg-accent dark:bg-zinc-900;
    }

    &:not(:last-of-type) {
      @apply -mb-px;
    }

    & [data-slot='item-media'] {
        & * {
        @apply size-10;
      }
    }

    & [data-slot='item'] {
      /* hover:bg-zinc-100 hover:dark:bg-zinc-900; */
      @apply py-2! flex-nowrap;
    }
  }
}
</style>
