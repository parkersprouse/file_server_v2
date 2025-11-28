import { get, set } from '@vueuse/core';
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
import type { LocationQueryValue, RouteLocationNormalizedGeneric } from 'vue-router';

export type QueryParamValue = SortDir | SortKey | ViewType;

export type RouterEventCallback = (
  to: RouteLocationNormalizedGeneric,
  from: RouteLocationNormalizedGeneric,
) => void | Promise<void>;

export const useRouterStore = defineStore('router', () => {
  const $event_bus = useEventBus();
  const $route = useRoute();
  const $router = useRouter();

  const after_callbacks = ref<RouterEventCallback[]>([]);

  const before_callbacks = ref<RouterEventCallback[]>([]);

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
      await updateQueryParam(QueryParam.VIEW, new_view);
    },
  });


  function addAfterCallback(callback: RouterEventCallback): void {
    const ac = get(after_callbacks);
    if (ac.includes(callback)) return;
    ac.push(callback);
  }

  function addBeforeCallback(callback: RouterEventCallback): void {
    const bc = get(before_callbacks);
    if (bc.includes(callback)) return;
    bc.push(callback);
  }

  function removeAfterCallback(callback: RouterEventCallback): void {
    const ac = get(after_callbacks);
    if (ac.includes(callback)) set(after_callbacks, ac.filter((cb) => cb !== callback));
  }

  function removeBeforeCallback(callback: RouterEventCallback): void {
    const bc = get(before_callbacks);
    if (bc.includes(callback)) set(before_callbacks, bc.filter((cb) => cb !== callback));
  }


  async function updateQueryParam(
    name: QueryParam,
    value: QueryParamValue,
  ): Promise<void> {
    try {
      await $router.push({
        query: {
          ...$route.query,
          [name]: value,
        },
      });
      await $event_bus.emit('query_updated', [value]);
    } catch { /**/ }
  }

  async function updateSorting(
    new_dir: SortDir,
    new_key: SortKey,
  ): Promise<void> {
    try {
      await $router.push({
        query: {
          ...$route.query,
          [QueryParam.DIR]: new_dir,
          [QueryParam.KEY]: new_key,
        },
      });
      await $event_bus.emit('query_updated', [new_dir, new_key]);
    } catch { /**/ }
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

    $router.beforeEach(async (to, from) => {
      const { path } = to;
      const should_update = path.includes('%5C');
      if (should_update) to.path = to.path.replace('%5C', '//');
      for (const callback of get(before_callbacks)) await callback(to, from);
      if (should_update) return to;
    });

    $router.afterEach(async (to, from) => {
      set(breadcrumbs, breadcrumbify($route));
      if (to.path !== from.path) $event_bus.emit('path_updated');

      for (const callback of get(after_callbacks)) await callback(to, from);
    });
  });

  return {
    /*-- State --*/
    breadcrumbs,
    dir,
    key,
    view,

    /*-- Functions --*/
    addAfterCallback,
    addBeforeCallback,
    removeAfterCallback,
    removeBeforeCallback,
    updateSorting,
  };
});
