<template>
  <Item variant='outline' size='sm'>
    <ItemMedia class='self-center! shrink-0 grow-0'>
      <component
        :is='fileTypeToIcon(entry.file_type || entry.entry_type)'
        class='size-7'
      />
    </ItemMedia>
    <ItemContent class='w-auto overflow-hidden'>
      <ItemTitle class='entry-title scrollbar-hidden'>
        {{ entry.name }}
      </ItemTitle>
      <ItemDescription
        v-if='$router_store.searching'
        class='truncate text-xs!'
      >
        {{ entryLocation(entry) }}
      </ItemDescription>
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
import { entryLocation, fileTypeToIcon } from 'lib/entry_helpers.ts';
import { useRouterStore } from 'stores/router.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
}>();

const $router_store = useRouterStore();
</script>

<style>
@reference '../../../assets/styles/index.css';

.entries--list {
  & .entry-wrapper {
    /*
     * Lift the row above its neighbours on hover AND focus. Rows are absolutely
     * positioned and share one z-index, so without this the next (opaque, zebra)
     * row paints over the focused row's bottom border / focus ring in their 1px
     * overlap — visible only on even rows, whose following row is the muted one.
     */
    @apply z-10 hover:z-20 focus-within:z-20;

    &[data-odd='true'] {
      @apply bg-muted;
    }

    & .entry {
      & [data-slot='item'] {
        /* hover:bg-zinc-100 hover:dark:bg-zinc-900; */
        @apply py-2! flex-nowrap border-l-0 border-r-0;

        & * {
          --tw-translate-x: 0;
          --tw-translate-y: 0;
        }
      }
    }

    &:not(:last-of-type) {
      & .entry {
        & [data-slot='item'] {
          @apply -mb-px;
        }
      }
    }
  }
}
</style>
