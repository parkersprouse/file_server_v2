<template>
  <Item class='flex-nowrap'>
    <ItemMedia class='self-center!'>
      <component
        :is='fileTypeToIcon(entry.file_type || entry.entry_type)'
        class='size-6'
      />
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
              <Badge class='entry-meta entry-meta__last-modified'>
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
            &bull;
            <Badge class='entry-meta entry-meta__duration'>
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
import { absolute, relative } from 'lib/datetime.ts';
import { fileTypeToIcon } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
  thumbnail?: string;
}>();
</script>
