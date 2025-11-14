<template>
  <section class='flex flex-row flex-nowrap justify-center items-center gap-2 w-full'>
    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": local_dir === SortDir.ASC }'
      @click='setLocalDir(SortDir.ASC)'
    >
      <icon-sort-ascending class='size-12!' />
    </Button>
    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": local_dir === SortDir.DESC }'
      @click='setLocalDir(SortDir.DESC)'
    >
      <icon-sort-descending class='size-12!' />
    </Button>
  </section>

  <!-- <hr class='w-1/2! p-0! my-1! border-zinc-500 border-dashed'> -->

  <section class='flex flex-row flex-nowrap justify-center items-center gap-2 w-full'>
    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": local_key === SortKey.NAME }'
      @click='setLocalKey(SortKey.NAME)'
    >
      <icon-tag class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": local_key === SortKey.DURATION }'
      @click='setLocalKey(SortKey.DURATION)'
    >
      <icon-timer class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": local_key === SortKey.MODIFIED }'
      @click='setLocalKey(SortKey.MODIFIED)'
    >
      <icon-clock-counter-clockwise class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='h-auto ghost-ext'
      :class='{ "ghost-ext--active": local_key === SortKey.CREATED }'
      @click='setLocalKey(SortKey.CREATED)'
    >
      <icon-file-plus class='size-12!' />
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

  console.log(dir, $store.dir, dir === $store.dir);
  console.log(key, $store.key, key === $store.key);

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
