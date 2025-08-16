import { get, set, useEventBus } from '@vueuse/core';
import { defineStore } from 'pinia';
import { onBeforeMount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { EventBus } from 'enums/event_bus.ts';
import { Events } from 'enums/events.ts';
import { SortDir } from 'enums/sort_dir.ts';
import { SortKey } from 'enums/sort_key.ts';
import { ViewType } from 'enums/view_type.ts';

export const useStore = defineStore('global', () => {
  const $entries_bus = useEventBus<Events>(EventBus.Entries);
  const $route = useRoute();
  const $router = useRouter();

  const active_dir = ref<SortDir>(SortDir.ASC);
  const active_key = ref<SortKey>(SortKey.NAME);
  const active_view = ref<ViewType>(ViewType.LIST);
  const img_mask_inverted = ref<boolean>(false);
  const toolbar_height = ref<number>(0);

  async function setDir(dir?: string): Promise<void> {
    const is_valid = Boolean(dir) && Object.values(SortDir).includes(dir as SortDir);
    set(active_dir, is_valid ? dir as SortDir : SortDir.ASC);
    await $router.push({
      force: true,
      query: {
        ...$route.query,
        dir: get(active_dir),
      },
    });
    $entries_bus.emit(Events.QueryUpdated);
  }

  async function setKey(key?: string): Promise<void> {
    const is_valid = Boolean(key) && Object.values(SortKey).includes(key as SortKey);
    set(active_key, is_valid ? key as SortKey : SortKey.NAME);
    await $router.push({
      force: true,
      query: {
        ...$route.query,
        key: get(active_key),
      },
    });
    $entries_bus.emit(Events.QueryUpdated);
  }

  async function setView(view?: string): Promise<void> {
    const is_valid = Boolean(view) && Object.values(ViewType).includes(view as ViewType);
    set(active_view, is_valid ? view as ViewType : ViewType.LIST);
    await $router.push({
      force: true,
      query: {
        ...$route.query,
        view: get(active_view),
      },
    });
    $entries_bus.emit(Events.QueryUpdated);
  }

  onBeforeMount(async () => {
    const { dir, key, view } = $route.query;
    await setDir(dir as SortDir);
    await setKey(key as SortKey);
    await setView(view as ViewType);
  });

  return {
    /*-- State --*/
    active_dir,
    active_key,
    active_view,
    img_mask_inverted,
    toolbar_height,

    /*-- Functions --*/
    setDir,
    setKey,
    setView,
  };
});
