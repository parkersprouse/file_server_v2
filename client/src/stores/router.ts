import { set } from '@vueuse/core';
import { defineStore } from 'pinia';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { useEventBus } from 'composables/event_bus.ts';
import { QueryParam } from 'enums/query_param.ts';
import { SortDir } from 'enums/sort_dir.ts';
import { SortKey } from 'enums/sort_key.ts';
import { ViewType } from 'enums/view_type.ts';
import { breadcrumbify } from 'lib/utils.ts';

import type { Breadcrumb } from 'types/breadcrumb.d.ts';
import type { LocationQueryValue } from 'vue-router';

export type QueryParamValue = SortDir | SortKey | ViewType;

export const useRouterStore = defineStore('router', () => {
  const $event_bus = useEventBus();
  const $route = useRoute();
  const $router = useRouter();

  const breadcrumbs = ref<Breadcrumb[]>([]);

  const dir = computed({
    get: () => validate($route.query.dir, SortDir, SortDir.ASC),
    set: async (new_dir: SortDir) => {
      await updateQueryParam(QueryParam.DIR, new_dir);
    },
  });

  const key = computed({
    get: () => validate($route.query.key, SortKey, SortKey.NAME),
    set: async (new_key: SortKey) => {
      await updateQueryParam(QueryParam.KEY, new_key);
    },
  });

  const view = computed({
    get: () => validate($route.query.view, ViewType, ViewType.LIST),
    set: async (new_view: ViewType) => {
      await updateQueryParam(QueryParam.VIEW, new_view, false);
    },
  });

  async function updateQueryParam(
    name: QueryParam,
    value: QueryParamValue,
    should_refresh: boolean = true,
  ): Promise<void> {
    $router.push({
      query: {
        ...$route.query,
        [name]: value,
      },
    })
      .then(async () => {
        await $event_bus.emit('query_updated', should_refresh);
      });
  }

  async function updateSorting(
    new_dir: SortDir,
    new_key: SortKey,
  ): Promise<void> {
    $router.push({
      query: {
        ...$route.query,
        [QueryParam.DIR]: new_dir,
        [QueryParam.KEY]: new_key,
      },
    })
      .then(async () => {
        await $event_bus.emit('query_updated', true);
      });
  }

  function validate<T extends string, TEnumValue extends string>(
    param: LocationQueryValue | LocationQueryValue[] | undefined,
    type: { [idx in T]: TEnumValue },
    fallback: TEnumValue,
  ): TEnumValue {
    const is_valid = Object.values(type).includes(param as string);
    return is_valid ? param as TEnumValue : fallback;
  }

  onMounted(() => {
    set(breadcrumbs, breadcrumbify($route));

    $router.afterEach((to, from) => {
      set(breadcrumbs, breadcrumbify($route));
      if (to.path !== from.path) $event_bus.emit('path_updated');
    });
  });

  return {
    /*-- State --*/
    breadcrumbs,
    dir,
    key,
    view,

    /*-- Functions --*/
    updateSorting,
  };
});
