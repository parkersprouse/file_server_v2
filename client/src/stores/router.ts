import { defineStore } from 'pinia';
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useEventBus } from 'composables/event_bus.ts';
import { SortDir } from 'enums/sort_dir.ts';
import { SortKey } from 'enums/sort_key.ts';
import { ViewType } from 'enums/view_type.ts';

import type { LocationQueryValue } from 'vue-router';

export const useRouterStore = defineStore('router', () => {
  const $event_bus = useEventBus();
  const $route = useRoute();
  const $router = useRouter();

  const dir = computed({
    get: () => validate($route.query.dir, SortDir, SortDir.ASC),
    set: (new_dir: SortDir) => {
      $router.push({
        query: {
          ...$route.query,
          dir: new_dir,
        },
      })
        .then(async () => { await $event_bus.emit('query_updated'); });
    },
  });

  const key = computed({
    get: () => validate($route.query.key, SortKey, SortKey.NAME),
    set: (new_key: SortKey) => {
      $router.push({
        query: {
          ...$route.query,
          key: new_key,
        },
      })
        .then(async () => { await $event_bus.emit('query_updated'); });
    },
  });

  const view = computed({
    get: () => validate($route.query.view, ViewType, ViewType.LIST),
    set: (new_view: ViewType) => {
      $router.push({
        query: {
          ...$route.query,
          view: new_view,
        },
      })
        .then(async () => { await $event_bus.emit('query_updated'); });
    },
  });

  function validate<T extends string, TEnumValue extends string>(
    param: LocationQueryValue | LocationQueryValue[] | undefined,
    type: { [idx in T]: TEnumValue },
    fallback: TEnumValue,
  ): TEnumValue {
    const is_valid = Object.values(type).includes(param as string);
    return is_valid ? param as TEnumValue : fallback;
  }

  return {
    /*-- State --*/
    dir,
    key,
    view,
  };
});
