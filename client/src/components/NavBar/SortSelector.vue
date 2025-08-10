<template>
  <DropdownMenu :modal='false'>
    <DropdownMenuTrigger
      style='flex: 1 0 auto;'
      class='ghost-ext flex flex-row flex-nowrap justify-center items-center self-stretch gap-1 w-auto h-auto p-1.5!'
      :class='{
        [klass ?? ""]: true,
      }'
    >
      <component
        :is='dir_icons[$store.active_dir]'
        class='size-6!'
      />
      <component
        :is='key_icons[$store.active_key]'
        class='size-6!'
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent>
      <DropdownMenuGroup>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.active_dir === SortDir.ASC }'
          @click='$store.setDir(SortDir.ASC)'
        >
          <icon-sort-ascending
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": $store.active_dir === SortDir.ASC }'
          />
          Ascending
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.active_dir === SortDir.DESC }'
          @click='$store.setDir(SortDir.DESC)'
        >
          <icon-sort-descending
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": $store.active_dir === SortDir.DESC }'
          />
          Descending
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.active_key === SortKey.NAME }'
          @click='$store.setKey(SortKey.NAME)'
        >
          <icon-tag
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": $store.active_key === SortKey.NAME }'
          />
          Name
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.active_key === SortKey.DURATION }'
          @click='$store.setKey(SortKey.DURATION)'
        >
          <icon-timer
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": $store.active_key === SortKey.DURATION }'
          />
          Duration
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.active_key === SortKey.MODIFIED }'
          @click='$store.setKey(SortKey.MODIFIED)'
        >
          <icon-clock-counter-clockwise
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": $store.active_key === SortKey.MODIFIED }'
          />
          Last Modified At
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": $store.active_key === SortKey.CREATED }'
          @click='$store.setKey(SortKey.CREATED)'
        >
          <icon-file-plus
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": $store.active_key === SortKey.CREATED }'
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
import { useStore } from 'stores/global.ts';

const {
  class: klass = null,
} = defineProps<{
  class?: string;
}>();

const $store = useStore();

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
