<template>
  <component
    :is='isDir(entry) ? DirEntry : FileEntry'
    :entry='entry'
  >
    <template #default>
      <Card class='p-0! h-full! gap-2!'>
        <CardContent class='flex flex-row flex-nowrap justify-center items-center p-0! grow shrink'>
          <img
            v-if='thumbnail'
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
            <Badge
              variant='outline'
              class='entry-meta entry-meta__last-modified'
            >
              <!-- v-tooltip='{ value: `Last modified on <span>${absolute(entry.last_modified_at)}</span>` }' -->
              <icon-clock-counter-clockwise />
              {{ relative(entry.last_modified_at) }}
            </Badge>
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
    </template>
  </component>
</template>

<script setup lang='ts'>
import DirEntry from 'components/directory_view/DirEntry.vue';
import FileEntry from 'components/directory_view/FileEntry.vue';
import { absolute as _, relative } from 'lib/datetime.ts';
import { fileTypeToIcon, isDir } from 'lib/entry_helpers.ts';

import type { Entry } from 'types/entry.d.ts';

defineProps<{
  entry: Entry;
  thumbnail?: string;
}>();
</script>

<style>
@reference '../../assets/styles/index.css';

.entry {
  @apply transition-none!;

  & .entry-meta {
    @apply transition-none text-muted-foreground border-b-0 shrink grow-0 gap-[0.15rem];
  }

  & .entry-meta__last-modified {
    @apply border-l-0;
  }

  & .entry-meta__duration {
    @apply border-r-0;
  }

  @variant hover {
    @apply text-cerise-red-500! dark:text-cerise-red-600!;

    & [data-slot='card'] {
      @apply border-cerise-red-500! dark:border-cerise-red-600!;
    }

    & .entry-meta,
    & [data-slot^='card-'] {
      @apply text-cerise-red-500! dark:text-cerise-red-600!;
    }

    & .entry-meta {
      @apply border-cerise-red-500/50! dark:border-cerise-red-600/50!;
    }
  }
}
</style>
