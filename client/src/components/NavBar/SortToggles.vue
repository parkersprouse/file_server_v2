<template>
  <section class='flex flex-row flex-nowrap justify-center items-center gap-2 w-full'>
    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": active_dir === SortDir.ASC }'
      @click='active_dir = SortDir.ASC'
    >
      <icon-sort-ascending class='size-12!' />
    </Button>
    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": active_dir === SortDir.DESC }'
      @click='active_dir = SortDir.DESC'
    >
      <icon-sort-descending class='size-12!' />
    </Button>
  </section>

  <!-- <hr class='w-1/2! p-0! my-1! border-zinc-500 border-dashed'> -->

  <section class='flex flex-row flex-nowrap justify-center items-center gap-2 w-full'>
    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": active_key === SortKey.NAME }'
      @click='active_key = SortKey.NAME'
    >
      <icon-tag class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": active_key === SortKey.DURATION }'
      @click='active_key = SortKey.DURATION'
    >
      <icon-timer class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": active_key === SortKey.MODIFIED }'
      @click='active_key = SortKey.MODIFIED'
    >
      <icon-clock-counter-clockwise class='size-12!' />
    </Button>

    <Button
      variant='ghost'
      class='p-1! h-auto ghost-ext'
      :class='{ "ghost-ext--active": active_key === SortKey.CREATED }'
      @click='active_key = SortKey.CREATED'
    >
      <icon-file-plus class='size-12!' />
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

const active_dir = ref<SortDir>(SortDir.ASC);
const active_key = ref<SortKey>(SortKey.NAME);

watch(active_dir, (new_value) => {
  $router.push({
    force: true,
    query: {
      ...$route.query,
      dir: new_value || undefined,
    },
  });
});

watch(active_key, (new_value) => {
  $router.push({
    force: true,
    query: {
      ...$route.query,
      key: new_value || undefined,
    },
  });
});

onBeforeMount(() => {
  const dir: SortDir = $route.query.dir as SortDir;
  const key: SortKey = $route.query.key as SortKey;

  if (Object.values(SortDir).includes(dir)) set(active_dir, dir);
  if (Object.values(SortKey).includes(key)) set(active_key, key);
});
</script>
