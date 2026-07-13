import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { stringifyQuery } from 'vue-router';

import { QueryParam } from 'enums/query_param.ts';
import { http } from 'lib/http.ts';

import type { ClassValue } from 'clsx';
import type { Breadcrumb } from 'types/breadcrumb.d.ts';
import type { Entry } from 'types/entry';
import type { LocationQuery, RouteLocationNormalizedLoadedGeneric } from 'vue-router';


/* ------------------ *
 * Breadcrumb Helpers *
 * ------------------ */

export function buildPath(
  parts: string[],
  route: RouteLocationNormalizedLoadedGeneric,
): Breadcrumb[] {
  const length = parts.length - 1;
  // Navigating a breadcrumb leaves the active search behind.
  const query = formatQuery(stripSearchParams(route.query));
  return parts.map((part, index) => ({
    label: part,
    path: index < length ? `/${parts.slice(0, index + 1).join('/')}${query}` : undefined,
  }));
}

export function breadcrumbify(route: RouteLocationNormalizedLoadedGeneric): Breadcrumb[] {
  const parts = trim(decodeURI(route.path)).split(/[\\/]+/g);
  return buildPath(parts, route).filter((part) => part.label.length > 0);
}


/* ------------- *
 * Route Helpers *
 * ------------- */

export function formatQuery(query: LocationQuery): string {
  return Object.keys(query).length > 0 ? `?${stringifyQuery(query)}` : '';
}

const SEARCH_QUERY_PARAMS: string[] = [
  QueryParam.CASE,
  QueryParam.FUZZY,
  QueryParam.MATCH,
  QueryParam.SCOPE,
  QueryParam.SEARCH,
];

/**
 * Drop the search-related params from a route query, so links built while a
 * search is active (breadcrumbs, folder results, back button) land on the
 * target directory's plain listing instead of re-running the search there.
 */
export function stripSearchParams(query: LocationQuery): LocationQuery {
  return Object.fromEntries(Object.entries(query).filter(([param]) => !SEARCH_QUERY_PARAMS.includes(param)));
}

export function pathToRoute(route: RouteLocationNormalizedLoadedGeneric): string {
  return `/${trim(route.path)}${formatQuery(route.query)}`;
}

export function toFileUrl(value: Entry | string): string {
  const path = typeof value === 'string' ? value : value.path;
  if (path.startsWith('http')) return path;
  // Encode each segment individually so the `/` separators are preserved; a
  // single `encodeURIComponent` would turn them into `%2F`, which many servers
  // (including actix by default) reject inside a path.
  const encoded = trim(path).split('/').map((segment) => encodeURIComponent(segment)).join('/');
  return `${http.defaults.baseURL!}/${encoded}`;
}


/* ------------ *
 * Path Helpers *
 * ------------ */

export function trim(path: string): string {
  return path.replace(/(^[\\/]*)|([\\/]*$)/g, '');
}


/* ------------- *
 * Misc. Helpers *
 * ------------- */

export function capitalize(str: string, lower_remainder: boolean = true): string {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- inline function
  const modifyCasing = (word: string): string => {
    const remainder = lower_remainder ? word.substring(1).toLocaleLowerCase() : word.substring(1);
    return `${word.charAt(0).toLocaleUpperCase()}${remainder}`;
  };

  return str
    .split(/\s+/g)
    .filter((part) => part.length > 0)
    .map((word) => modifyCasing(word))
    .join(' ');
}

// duplicate of the tailwind function that merges static CSS classes with dynamic ones
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
