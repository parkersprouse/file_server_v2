<template>
  <component
    :is='isDir(entry) ? RouterLink : "div"'
    v-bind='{
      to: isDir(entry) ? buildRoute(entry) : undefined,
    }'
    class='entry'
  >
    <Card class='p-0! h-full! gap-2!'>
      <CardContent class='p-0! grow shrink-0 text-center'>
        {{ entry.file_type || entry.entry_type }}
      </CardContent>
      <CardFooter class='flex flex-col flex-nowrap justify-center items-start p-0! grow-0'>
        <div
          class='max-w-full w-full text-nowrap whitespace-nowrap text-ellipsis
                 overflow-y-clip overflow-x-scroll scrollbar-hidden'
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
  </component>
</template>

<script setup lang='ts'>
import { RouterLink, useRoute } from 'vue-router';

import { EntryType } from 'enums/entry_type.ts';
import { absolute, relative } from 'lib/datetime.ts';

import type { EntryDetails } from 'types/entry_details.d.ts';
import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router';

defineProps<{
  entry: EntryDetails;
}>();

const $route = useRoute();

function buildRoute(entry: EntryDetails): RouteLocationNormalizedLoadedGeneric {
  return {
    path: entry.path,
    query: {
      ...$route.query,
    },
  } as RouteLocationNormalizedLoadedGeneric;
}

function isDir(entry: EntryDetails): boolean {
  return entry.entry_type === EntryType.DIR;
}
</script>
