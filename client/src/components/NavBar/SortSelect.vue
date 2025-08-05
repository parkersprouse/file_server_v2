<template>
  <Select v-model='selection'>
    <SelectTrigger  class='bg-transparent! hover:bg-input/50! border-none!'>
      <SelectValue placeholder='Sort'>
        <slot v-if='selection'>
          <icon-sort-ascending v-if='to_dir === "asc"' />
          <icon-sort-descending v-else />
          {{ labelized_key }}
        </slot>
      </SelectValue>
    </SelectTrigger>

    <SelectContent>
      <SelectGroup>
        <SelectItem value='name+asc'>
          <icon-sort-ascending />
          <SelectItemText>
            Name
          </SelectItemText>
        </SelectItem>
        <SelectItem value='name+desc'>
          <icon-sort-descending />
          <SelectItemText>
            Name
          </SelectItemText>
        </SelectItem>
        <SelectSeparator />
        <SelectItem value='duration+asc'>
          <icon-sort-ascending />
          <SelectItemText>
            Duration
          </SelectItemText>
        </SelectItem>
        <SelectItem value='duration+desc'>
          <icon-sort-descending />
          <SelectItemText>
            Duration
          </SelectItemText>
        </SelectItem>
        <SelectSeparator />
        <SelectItem value='last_modified_at+asc'>
          <icon-sort-ascending />
          <SelectItemText>
            Last Modified At
          </SelectItemText>
        </SelectItem>
        <SelectItem value='last_modified_at+desc'>
          <icon-sort-descending />
          <SelectItemText>
            Last Modified At
          </SelectItemText>
        </SelectItem>
        <SelectSeparator />
        <SelectItem value='created_at+asc'>
          <icon-sort-ascending />
          <SelectItemText>
            Created At
          </SelectItemText>
        </SelectItem>
        <SelectItem value='created_at+desc'>
          <icon-sort-descending />
          <SelectItemText>
            Created At
          </SelectItemText>
        </SelectItem>
      </SelectGroup>
    </SelectContent>
  </Select>
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { computed, nextTick, onBeforeMount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { SortDir } from '@/types/sort_dir.ts';
import { SortKey } from '@/types/sort_key.ts';

const $route = useRoute();
const $router = useRouter();

const selection = ref<string>();

const selection_parts = computed<string[] | undefined>(() => get(selection)?.split('+'));
const to_key = computed<SortKey | undefined>(() => get(selection_parts)?.[0] as SortKey);
const to_dir = computed<SortDir | undefined>(() => get(selection_parts)?.[1] as SortDir);
const labelized_key = computed<string | undefined>(() =>
  get(to_key)?.split('_').map((word) => `${word[0].toUpperCase()}${word.substring(1).toLowerCase()}`).join(' '));

watch(selection, (new_value) => {
  if (!new_value) return;
  $router.push({
    force: true,
    query: {
      ...$route.query,
      dir: get(to_dir),
      key: get(to_key),
    },
  });
});

function verifySortParams(dir: SortDir, key: SortKey): boolean {
  return Object.values(SortDir).includes(dir) && Object.values(SortKey).includes(key);
}

onBeforeMount(() => {
  const { dir, key } = $route.query;
  if (dir && key && verifySortParams(dir as SortDir, key as SortKey)) {
    set(selection, `${key}+${dir}`);
  } else {
    nextTick(() => {
      set(selection, 'name+asc');
    });
  }
});
</script>
