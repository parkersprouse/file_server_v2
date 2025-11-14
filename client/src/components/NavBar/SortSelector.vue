<template>
  <DropdownMenu
    :modal='false'
    @update:open='(open: boolean) => !open && commit()'
  >
    <DropdownMenuTrigger
      style='flex: 1 0 auto;'
      class='ghost-ext flex flex-row flex-nowrap justify-center items-center self-stretch gap-1 w-auto h-auto p-1.5!'
      :class='props.class ?? ""'
    >
      <component
        :is='dir_icons[local_dir || SortDir.ASC]'
        class='size-6!'
      />
      <component
        :is='key_icons[local_key || SortKey.NAME]'
        class='size-6!'
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent class='p-0!'>
      <DropdownMenuGroup>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": local_dir === SortDir.ASC }'
          @select.prevent='setLocalDir(SortDir.ASC)'
        >
          <icon-sort-ascending class='size-6!' />
          Ascending
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": local_dir === SortDir.DESC }'
          @select.prevent='setLocalDir(SortDir.DESC)'
        >
          <icon-sort-descending class='size-6!' />
          Descending
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": local_key === SortKey.NAME }'
          @select.prevent='setLocalKey(SortKey.NAME)'
        >
          <icon-tag class='size-6!' />
          Name
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": local_key === SortKey.DURATION }'
          @select.prevent='setLocalKey(SortKey.DURATION)'
        >
          <icon-timer class='size-6!' />
          Duration
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": local_key === SortKey.MODIFIED }'
          @select.prevent='setLocalKey(SortKey.MODIFIED)'
        >
          <icon-clock-counter-clockwise class='size-6!' />
          Last Modified At
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": local_key === SortKey.CREATED }'
          @select.prevent='setLocalKey(SortKey.CREATED)'
        >
          <icon-file-plus class='size-6!' />
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

import { get, set } from '@vueuse/core';
import { computed, onMounted, ref } from 'vue';

import { SortDir } from 'enums/sort_dir.ts';
import { SortKey } from 'enums/sort_key.ts';
import { useRouterStore } from 'stores/router.ts';

import type { HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const $store = useRouterStore();

const local_dir = ref<SortDir>();
const local_key = ref<SortKey>();

const dir_icons = computed(() => ({
  asc: IconSortAscending,
  desc: IconSortDescending,
}));

const key_icons = computed(() => ({
  created_at: IconFilePlus,
  duration: IconTimer,
  last_modified_at: IconClockCounterClockwise,
  name: IconTag,
}));

function setLocalDir(dir: SortDir): void {
  set(local_dir, dir);
}

function setLocalKey(key: SortKey): void {
  set(local_key, key);
}

async function commit(): Promise<void> {
  const dir = get(local_dir);
  const key = get(local_key);

  console.log(dir, $store.dir, dir === $store.dir);
  console.log(key, $store.key, key === $store.key);

  if (dir === $store.dir && key === $store.key) return;
  await $store.updateSorting(dir!, key!);
}

onMounted(() => {
  set(local_dir, $store.dir);
  set(local_key, $store.key);
});
</script>
