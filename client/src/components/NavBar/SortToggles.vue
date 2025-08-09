<template>
  <section class='flex flex-row flex-nowrap justify-center items-center gap-2 w-full'>
    <Button
      variant='ghost'
      class='p-1! h-auto'
      @click='active_dir = SortDir.ASC'
    >
      <icon-sort-ascending-bold
        v-if='active_dir === SortDir.ASC'
        class='size-12! text-teal-700 dark:text-teal-600'
      />
      <icon-sort-ascending
        v-else
        class='size-12!'
      />
    </Button>
    <Button
      variant='ghost'
      class='p-1! h-auto'
      @click='active_dir = SortDir.DESC'
    >
      <icon-sort-descending-bold
        v-if='active_dir === SortDir.DESC'
        class='size-12! text-teal-700 dark:text-teal-600'
      />
      <icon-sort-descending
        v-else
        class='size-12!'
      />
    </Button>
  </section>
  <!-- <hr class='w-1/2! p-0! my-1! border-zinc-500 border-dashed'> -->
  <section class='flex flex-row flex-nowrap justify-center items-center gap-2 w-full'>
    <Button
      variant='ghost'
      class='p-1! h-auto'
      @click='active_key = SortKey.NAME'
    >
      <icon-tag-fill
        v-if='active_key === SortKey.NAME'
        class='size-12! text-teal-700 dark:text-teal-600'
      />
      <icon-tag
        v-else
        class='size-12!'
      />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto'
      @click='active_key = SortKey.DURATION'
    >
      <icon-timer-fill
        v-if='active_key === SortKey.DURATION'
        class='size-12! text-teal-700 dark:text-teal-600'
      />
      <icon-timer
        v-else
        class='size-12!'
      />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto'
      @click='active_key = SortKey.MODIFIED'
    >
      <icon-clock-counter-clockwise-bold
        v-if='active_key === SortKey.MODIFIED'
        class='size-12! text-teal-700 dark:text-teal-600'
      />
      <icon-clock-counter-clockwise
        v-else
        class='size-12!'
      />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto'
      @click='active_key = SortKey.CREATED'
    >
      <icon-file-plus-fill
        v-if='active_key === SortKey.CREATED'
        class='size-12! text-teal-700 dark:text-teal-600'
      />
      <icon-file-plus
        v-else
        class='size-12!'
      />
    </Button>
  </section>
</template>

<script setup lang='ts'>
import { set } from '@vueuse/core';
import { onBeforeMount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { SortDir } from 'types/sort_dir.ts';
import { SortKey } from 'types/sort_key.ts';

const $route = useRoute();
const $router = useRouter();

const active_dir = ref<SortDir>();
const active_key = ref<SortKey>();

watch(active_dir, (new_value) => {
  if (!new_value) return;
  $router.push({
    force: true,
    query: {
      ...$route.query,
      dir: new_value,
    },
  });
});

watch(active_key, (new_value) => {
  if (!new_value) return;
  $router.push({
    force: true,
    query: {
      ...$route.query,
      key: new_value,
    },
  });
});

function verifySortDir(dir: SortDir): boolean {
  return Object.values(SortDir).includes(dir);
}

function verifySortKey(key: SortKey): boolean {
  return Object.values(SortKey).includes(key);
}

onBeforeMount(() => {
  const { dir, key } = $route.query;
  if (dir && key && verifySortDir(dir as SortDir) && verifySortKey(key as SortKey)) {
    set(active_dir, dir);
    set(active_key, key);
  } else {
    set(active_dir, SortDir.ASC);
    set(active_key, SortKey.NAME);
  }
});
</script>
