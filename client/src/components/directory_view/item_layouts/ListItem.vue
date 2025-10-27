<template>
  <Item variant='outline' size='sm'>
    <ItemMedia class='self-center! shrink-0 grow-0'>
      <component
        :is='fileTypeToIcon(entry.file_type || entry.entry_type)'
        class='size-7'
      />
    </ItemMedia>
    <ItemContent class='w-auto overflow-hidden'>
      <ItemTitle class='w-full block text-nowrap whitespace-nowrap text-ellipsis
                        overflow-y-hidden overflow-x-scroll scrollbar-hidden'
      >
        {{ entry.name }}
      </ItemTitle>
    </ItemContent>
    <ItemContent
      v-if='Boolean(entry.duration)'
      class='w-auto shrink-0 grow-0'
    >
      <ItemDescription>
        <Badge
          variant='outline'
          class='entry-meta entry-meta__duration'
        >
          <icon-timer />
          {{ entry.duration }}
        </Badge>
      </ItemDescription>
    </ItemContent>
    <ItemContent class='w-auto shrink-0 grow-0'>
      <ItemDescription>
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
      </ItemDescription>
    </ItemContent>
  </Item>
</template>

<script setup lang='ts'>
import { absolute, relative } from 'lib/datetime.ts';
import { fileTypeToIcon } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
  thumbnail?: string;
}>();
</script>

<style>
@reference '../../../assets/styles/index.css';

.entries--list {
  & .entry {
    @apply z-10 hover:z-20;

    &:nth-child(odd) {
      @apply bg-accent dark:bg-zinc-900;
    }

    &:not(:last-of-type) {
      @apply -mb-px;
    }

    & [data-slot='item'] {
      /* hover:bg-zinc-100 hover:dark:bg-zinc-900; */
      @apply py-2! flex-nowrap border-l-0 border-r-0;

      & * {
        --tw-translate-x: 0;
        --tw-translate-y: 0;
      }
    }
  }
}
</style>
