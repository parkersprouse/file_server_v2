<template>
  <EntryItem :entry='entry'>
    <Card class='p-0! h-full! gap-2!'>
      <CardContent class='flex flex-row flex-nowrap justify-center items-center p-0! grow shrink'>
        <img
          v-if='thumbnail && heic_check'
          :src='thumbnail'
          class='w-auto h-auto object-contain aspect-square'
        >
        <component
          v-else
          :is='fileTypeToIcon(entry.file_type || entry.entry_type)'
          class='size-1/2 aspect-square'
        />
      </CardContent>
      <CardFooter class='flex flex-col flex-nowrap justify-center items-start p-0! grow-0'>
        <div
          class='entry-name max-w-full w-full text-nowrap whitespace-nowrap text-ellipsis
                 overflow-y-hidden overflow-x-scroll scrollbar-hidden py-1 px-2'
        >
          {{ entry.name }}
        </div>
        <div class='flex flex-row flex-nowrap justify-between items-center w-full'>
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
          <Badge
            v-if='Boolean(entry.duration)'
            variant='outline'
            class='entry-meta entry-meta__duration'
          >
            <icon-timer />
            {{ entry.duration }}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  </EntryItem>
</template>

<script setup lang='ts'>
import { inject } from 'vue';

import { absolute, relative } from 'lib/datetime.ts';
import { fileTypeToIcon } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
  thumbnail?: string;
}>();

const heic_check = inject<boolean>('heic_check', false);
</script>
