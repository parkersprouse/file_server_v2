<template>
  <DropdownMenu :modal='false'>
    <DropdownMenuTrigger
      style='flex: 1 0 auto;'
      class='ghost-ext flex flex-row flex-nowrap justify-center items-center self-stretch gap-1 w-auto h-auto p-1.5!'
      :class='props.class ?? ""'
    >
      <component
        :is='dir_icons[$store.dir]'
        class='size-6!'
      />
      <component
        :is='key_icons[$store.key]'
        class='size-6!'
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent class='p-0!'>
      <DropdownMenuGroup>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.dir === SortDir.ASC }'
          @click='$store.dir = SortDir.ASC'
        >
          <icon-sort-ascending
            class='size-6! ghost-ext'
            :class='{ "ghost-ext--active": $store.dir === SortDir.ASC }'
          />
          Ascending
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.dir === SortDir.DESC }'
          @click='$store.dir = SortDir.DESC'
        >
          <icon-sort-descending
            class='size-6! ghost-ext'
            :class='{ "ghost-ext--active": $store.dir === SortDir.DESC }'
          />
          Descending
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.key === SortKey.NAME }'
          @click='$store.key = SortKey.NAME'
        >
          <icon-tag
            class='size-6! ghost-ext'
            :class='{ "ghost-ext--active": $store.key === SortKey.NAME }'
          />
          Name
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.key === SortKey.DURATION }'
          @click='$store.key = SortKey.DURATION'
        >
          <icon-timer
            class='size-6! ghost-ext'
            :class='{ "ghost-ext--active": $store.key === SortKey.DURATION }'
          />
          Duration
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.key === SortKey.MODIFIED }'
          @click='$store.key = SortKey.MODIFIED'
        >
          <icon-clock-counter-clockwise
            class='size-6! ghost-ext'
            :class='{ "ghost-ext--active": $store.key === SortKey.MODIFIED }'
          />
          Last Modified At
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.key === SortKey.CREATED }'
          @click='$store.key = SortKey.CREATED'
        >
          <icon-file-plus
            class='size-6! ghost-ext'
            :class='{ "ghost-ext--active": $store.key === SortKey.CREATED }'
          />
          Created At
        </DropdownMenuItem>
      </DropdownMenuGroup>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang='ts'>
import IconClockCounterClockwise from '~icons/ph/clock-counter-clockwise';
import IconFilePlus from '~icons/ph/file-plus';
import IconSortAscending from '~icons/ph/sort-ascending';
import IconSortDescending from '~icons/ph/sort-descending';
import IconTag from '~icons/ph/tag';
import IconTimer from '~icons/ph/timer';

import { ref } from 'vue';

import { SortDir } from 'enums/sort_dir.ts';
import { SortKey } from 'enums/sort_key.ts';
import { useRouterStore } from 'stores/router.ts';

import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const $store = useRouterStore();

const dir_icons = ref({
  asc: IconSortAscending,
  desc: IconSortDescending,
});

const key_icons = ref({
  created_at: IconFilePlus,
  duration: IconTimer,
  last_modified_at: IconClockCounterClockwise,
  name: IconTag,
});
</script>
