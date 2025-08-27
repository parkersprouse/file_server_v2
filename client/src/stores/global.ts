import { get, set } from '@vueuse/core';
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useEventBus } from 'composables/event_bus.ts';
import { SortDir } from 'enums/sort_dir.ts';
import { SortKey } from 'enums/sort_key.ts';
import { ViewType } from 'enums/view_type.ts';

export const useStore = defineStore('global', () => {
  const $event_bus = useEventBus();
  const $route = useRoute();
  const $router = useRouter();

  const { dir, key, view } = $route.query;
  const active_dir = ref<SortDir>(dir ? dir as SortDir : SortDir.ASC);
  const active_key = ref<SortKey>(key ? key as SortKey : SortKey.NAME);
  const active_view = ref<ViewType>(view ? view as ViewType : ViewType.LIST);

  const preview_bg_enabled = ref<boolean>();
  const toolbar_height = ref<number>(0);

  async function setDir(new_dir?: string): Promise<void> {
    const is_valid = Boolean(new_dir) && Object.values(SortDir).includes(new_dir as SortDir);
    set(active_dir, is_valid ? new_dir as SortDir : SortDir.ASC);
    await $router.push({
      force: true,
      query: {
        ...$route.query,
        dir: get(active_dir),
      },
    });
    $event_bus.emit('query_updated');
  }

  async function setKey(new_key?: string): Promise<void> {
    const is_valid = Boolean(new_key) && Object.values(SortKey).includes(new_key as SortKey);
    set(active_key, is_valid ? new_key as SortKey : SortKey.NAME);
    await $router.push({
      force: true,
      query: {
        ...$route.query,
        key: get(active_key),
      },
    });
    $event_bus.emit('query_updated');
  }

  async function setView(new_view?: string): Promise<void> {
    const is_valid = Boolean(new_view) && Object.values(ViewType).includes(new_view as ViewType);
    set(active_view, is_valid ? new_view as ViewType : ViewType.LIST);
    await $router.push({
      force: true,
      query: {
        ...$route.query,
        view: get(active_view),
      },
    });
    $event_bus.emit('query_updated');
  }

  return {
    /*-- State --*/
    active_dir,
    active_key,
    active_view,
    preview_bg_enabled,
    toolbar_height,

    /*-- Functions --*/
    setDir,
    setKey,
    setView,
  };
});
