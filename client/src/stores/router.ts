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

  const dir = computed<SortDir>(() => validate($route.query.dir, SortDir, SortDir.ASC));

  const key = computed<SortKey>(() => validate($route.query.key, SortKey, SortKey.NAME));

  const view = computed({
    get: () => validate($route.query.view, ViewType, ViewType.LIST),
    set: (new_view: ViewType) => { pushQuery({ [QueryParam.VIEW]: new_view }); },
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

  async function pushQuery(patches: Record<string, QueryParamValue>): Promise<void> {
    try {
      await $router.push({
        query: {
          ...$route.query,
          ...patches,
        },
      });
      await $event_bus.emit('query_updated', Object.values(patches));
    } catch { /**/ }
  }

  async function updateSorting(new_dir: SortDir, new_key: SortKey): Promise<void> {
    await pushQuery({
      [QueryParam.DIR]: new_dir,
      [QueryParam.KEY]: new_key,
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

    $router.beforeEach(async (to, from) => {
      // Windows-style paths arrive with backslashes percent-encoded as `%5C`;
      // rewrite every occurrence (not just the first) to forward slashes.
      const corrected_path = to.path.includes('%5C') ?
        to.path.replace(/%5C/g, '//') :
        null;

      if ((corrected_path ?? to.path) !== from.path) $event_bus.emit('path_updating', {
        from,
        to,
      });

      for (const callback of get(before_callbacks)) await callback(to, from);
      if (corrected_path) return {
        hash: to.hash,
        path: corrected_path,
        query: to.query,
      };
    });

    $router.afterEach(async (to, from) => {
      set(breadcrumbs, breadcrumbify($route));
      if (to.path !== from.path) $event_bus.emit('path_updated', {
        from,
        to,
      });

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
