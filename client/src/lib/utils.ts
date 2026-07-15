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
  // Navigating a breadcrumb leaves the active search / direct link behind.
  const query = formatQuery(stripTransientParams(route.query));
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

const TRANSIENT_QUERY_PARAMS: string[] = [
  QueryParam.CASE,
  QueryParam.FUZZY,
  QueryParam.LINKED,
  QueryParam.MATCH,
  QueryParam.SCOPE,
  QueryParam.SEARCH,
];

/**
 * Drop the transient params (search state, direct-link target) from a route
 * query, so links built while they're active (breadcrumbs, folder results,
 * back button) land on the target directory's plain listing instead of
 * re-running the search / re-activating the direct link there.
 */
export function stripTransientParams(query: LocationQuery): LocationQuery {
  return Object.fromEntries(Object.entries(query).filter(([param]) => !TRANSIENT_QUERY_PARAMS.includes(param)));
}

export function pathToRoute(route: RouteLocationNormalizedLoadedGeneric): string {
  // The direct-link param is resolved entirely client-side; keep it out of the
  // server request URL (and thus the directory cache key).
  const { [QueryParam.LINKED]: _linked, ...query } = route.query;
  return `/${trim(route.path)}${formatQuery(query)}`;
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

/**
 * Copy a string to the clipboard, returning whether it succeeded.
 * `navigator.clipboard` only exists in secure contexts, and this app is
 * commonly served over plain-HTTP LAN origins, so the `execCommand` fallback
 * is load-bearing — it must run synchronously within the user gesture.
 */
export async function copyText(text: string): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- absent on insecure (plain-HTTP) origins
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.append(textarea);
  textarea.select();
  let copied: boolean;
  try {
    copied = document.execCommand('copy');
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}

export async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}
