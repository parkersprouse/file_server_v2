<template>
  <Item variant='outline'>
    <ItemMedia
      v-if='entry.thumbnail && heic_check'
      variant='image'
    >
       <img
         :src='entry.thumbnail'
         :alt='entry.name'
         loading='lazy'
         decoding='async'
         class='object-contain! aspect-square!'
       >
    </ItemMedia>
    <ItemMedia v-else>
      <component
        :is='fileTypeToIcon(entry.file_type || entry.entry_type)'
        aria-hidden='true'
      />
    </ItemMedia>
    <ItemContent class='w-auto overflow-hidden'>
      <ItemTitle class='entry-title scrollbar-hidden'>
        {{ entry.name }}
      </ItemTitle>
      <ItemDescription>
        <div class='flex flex-row flex-nowrap justify-start items-center w-full gap-2 text-muted-foreground'>
          <Badge
            v-if='$router_store.searching'
            variant='ghost'
            class='entry-meta entry-meta__location min-w-0'
          >
            <icon-folder-simple aria-hidden='true' />
            <span class='truncate'>{{ entryLocation(entry) }}</span>
          </Badge>
          <EntryModifiedBadge
            :entry='entry'
            variant='ghost'
          />
          <EntryDurationBadge
            :entry='entry'
            variant='ghost'
          />
        </div>
      </ItemDescription>
    </ItemContent>
  </Item>
</template>

<script setup lang='ts'>
import { inject } from 'vue';

import { entryLocation, fileTypeToIcon } from 'lib/entry_helpers.ts';
import { useRouterStore } from 'stores/router.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
}>();

const $router_store = useRouterStore();
const heic_check = inject<boolean>('heic_check', false);
</script>

<style>
@reference '../../../assets/styles/index.css';

.entries--row {
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
