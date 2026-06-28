<template>
  <section class='flex flex-row flex-nowrap justify-center items-center gap-2 w-full'>
    <Button
      variant='ghost'
      aria-label='Sort ascending'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": local_dir === SortDir.ASC }'
      :aria-pressed='local_dir === SortDir.ASC'
      @click='setLocalDir(SortDir.ASC)'
    >
      <icon-sort-ascending aria-hidden='true' class='size-12!' />
    </Button>
    <Button
      variant='ghost'
      aria-label='Sort descending'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": local_dir === SortDir.DESC }'
      :aria-pressed='local_dir === SortDir.DESC'
      @click='setLocalDir(SortDir.DESC)'
    >
      <icon-sort-descending aria-hidden='true' class='size-12!' />
    </Button>
  </section>

  <section class='flex flex-row flex-nowrap justify-center items-center gap-2 w-full'>
    <Button
      variant='ghost'
      aria-label='Sort by name'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": local_key === SortKey.NAME }'
      :aria-pressed='local_key === SortKey.NAME'
      @click='setLocalKey(SortKey.NAME)'
    >
      <icon-tag aria-hidden='true' class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      aria-label='Sort by duration'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": local_key === SortKey.DURATION }'
      :aria-pressed='local_key === SortKey.DURATION'
      @click='setLocalKey(SortKey.DURATION)'
    >
      <icon-timer aria-hidden='true' class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      aria-label='Sort by last modified'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": local_key === SortKey.MODIFIED }'
      :aria-pressed='local_key === SortKey.MODIFIED'
      @click='setLocalKey(SortKey.MODIFIED)'
    >
      <icon-clock-counter-clockwise aria-hidden='true' class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      aria-label='Sort by date created'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": local_key === SortKey.CREATED }'
      :aria-pressed='local_key === SortKey.CREATED'
      @click='setLocalKey(SortKey.CREATED)'
    >
      <icon-file-plus aria-hidden='true' class='size-12!' />
    </Button>
  </section>
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { onMounted, ref } from 'vue';

import { SortDir } from 'enums/sort_dir.ts';
import { SortKey } from 'enums/sort_key.ts';
import { useRouterStore } from 'stores/router.ts';

const $store = useRouterStore();

const local_dir = ref<SortDir>();
const local_key = ref<SortKey>();

function setLocalDir(dir: SortDir): void {
  set(local_dir, dir);
}

function setLocalKey(key: SortKey): void {
  set(local_key, key);
}

async function commit(): Promise<void> {
  const dir = get(local_dir);
  const key = get(local_key);

  if (dir === $store.dir && key === $store.key) return;
  await $store.updateSorting(dir!, key!);
}

defineExpose<{
  commit: () => Promise<void>;
}>({
  commit,
});

onMounted(() => {
  set(local_dir, $store.dir);
  set(local_key, $store.key);
});
</script>
