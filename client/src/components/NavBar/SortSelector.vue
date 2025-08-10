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
        :is='dir_icons[selected_dir]'
        class='size-6!'
      />
      <component
        :is='key_icons[selected_key]'
        class='size-6!'
      />
    </DropdownMenuTrigger>

    <DropdownMenuContent>
      <DropdownMenuGroup>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": selected_dir === SortDir.ASC }'
          @click='selected_dir = SortDir.ASC'
        >
          <icon-sort-ascending
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": selected_dir === SortDir.ASC }'
          />
          Ascending
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": selected_dir === SortDir.DESC }'
          @click='selected_dir = SortDir.DESC'
        >
          <icon-sort-descending
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": selected_dir === SortDir.DESC }'
          />
          Descending
        </DropdownMenuItem>
      </DropdownMenuGroup>

      <DropdownMenuSeparator />

      <DropdownMenuGroup>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": selected_key === SortKey.NAME }'
          @click='selected_key = SortKey.NAME'
        >
          <icon-tag
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": selected_key === SortKey.NAME }'
          />
          Name
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": selected_key === SortKey.DURATION }'
          @click='selected_key = SortKey.DURATION'
        >
          <icon-timer
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": selected_key === SortKey.DURATION }'
          />
          Duration
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": selected_key === SortKey.MODIFIED }'
          @click='selected_key = SortKey.MODIFIED'
        >
          <icon-clock-counter-clockwise
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": selected_key === SortKey.MODIFIED }'
          />
          Last Modified At
        </DropdownMenuItem>
        <DropdownMenuItem
          class='ghost-ext'
          :class='{ "ghost-ext--active": selected_key === SortKey.CREATED }'
          @click='selected_key = SortKey.CREATED'
        >
          <icon-file-plus
            class='size-5! ghost-ext'
            :class='{ "ghost-ext--active": selected_key === SortKey.CREATED }'
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

import { set } from '@vueuse/core';
import { onBeforeMount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { SortDir } from 'types/sort_dir.ts';
import { SortKey } from 'types/sort_key.ts';

const {
  class: klass = null,
} = defineProps<{
  class?: string;
}>();

const $route = useRoute();
const $router = useRouter();

const selected_dir = ref<SortDir>(SortDir.ASC);
const selected_key = ref<SortKey>(SortKey.NAME);

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

watch(selected_dir, (new_value) => {
  $router.push({
    force: true,
    query: {
      ...$route.query,
      dir: new_value || undefined,
    },
  });
});

watch(selected_key, (new_value) => {
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

  if (Object.values(SortDir).includes(dir)) set(selected_dir, dir);
  if (Object.values(SortKey).includes(key)) set(selected_key, key);
});
</script>
