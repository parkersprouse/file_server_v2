<template>
  <component
    :is='isDir(entry) ? DirEntry : FileEntry'
    :entry='entry'
  >
    <template #default>
      <Card class='p-0! h-full! gap-2!'>
        <CardContent class='flex flex-row flex-nowrap justify-center items-center p-0! grow shrink-0'>
          <component
            :is='fileTypeToIcon(entry.file_type || entry.entry_type)'
            class='size-1/2'
          />
        </CardContent>
        <CardFooter class='flex flex-col flex-nowrap justify-center items-start p-0! grow-0'>
          <div
            class='entry-name max-w-full w-full text-nowrap whitespace-nowrap text-ellipsis
                  overflow-y-clip overflow-x-scroll scrollbar-hidden py-1 px-2'
          >
            {{ entry.name }}
          </div>
          <div class='flex flex-row flex-wrap justify-between items-center'>
            <Tooltip
              :delay-duration='500'
              :disable-closing-trigger='true'
              :disable-hoverable-content='true'
              :skip-delay-duration='300'
            >
              <TooltipTrigger as-child>
                <Badge
                  variant='outline'
                  class='entry-last-modified'
                >
                  <icon-clock-counter-clockwise />
                  {{ relative(entry.last_modified_at) }}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Last modified on <span>{{ absolute(entry.last_modified_at) }}</span>
              </TooltipContent>
            </Tooltip>
            <Badge
              v-if='Boolean(entry.duration)'
              variant='outline'
            >
              {{ entry.duration }}
            </Badge>
          </div>
        </CardFooter>
      </Card>
    </template>
  </component>
</template>

<script setup lang='ts'>
import DirEntry from 'components/directory/DirEntry.vue';
import FileEntry from 'components/directory/FileEntry.vue';
import { absolute, relative } from 'lib/datetime.ts';
import { fileTypeToIcon, isDir } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
}>();
</script>

<style>
@reference '../../assets/styles/index.css';

.entry {
  @apply transition-none!;

  & .entry-last-modified {
    @apply transition-none text-muted-foreground border-b-0 border-l-0;
  }

  @variant hover {
    @apply text-cerise-red-500! dark:text-cerise-red-600!;

    & [data-slot='card'] {
      /* @apply bg-zinc-200! dark:bg-accent!; */
      @apply border-cerise-red-500! dark:border-cerise-red-600!;
    }

    & .entry-last-modified,
    & [data-slot^='card-'] {
      @apply text-cerise-red-500! dark:text-cerise-red-600!;
    }
  }
}
</style>
