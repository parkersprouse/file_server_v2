import type { RouteLocationNormalizedGeneric } from 'vue-router';

export interface PathUpdate {
  from: RouteLocationNormalizedGeneric;
  to: RouteLocationNormalizedGeneric;
}
