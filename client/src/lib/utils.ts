import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { stringifyQuery } from 'vue-router';

import type { Breadcrumb } from 'types/breadcrumb.d.ts';
import type { ClassValue } from 'clsx';
import type { LocationQuery, RouteLocationNormalizedLoadedGeneric } from 'vue-router';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function buildPath(
  parts: string[],
  route: RouteLocationNormalizedLoadedGeneric,
): Breadcrumb[] {
  const length = parts.length - 1;
  const query = formatQuery(route.query);
  return parts.map((part, index) => ({
    label: part,
    path: index < length ? `/${parts.slice(0, index + 1).join('/')}${query}` : undefined,
  }));
}

export function formatQuery(query: LocationQuery): string {
  return Object.keys(query).length > 0 ? `?${stringifyQuery(query)}` : '';
}

export function breadcrumbify(route: RouteLocationNormalizedLoadedGeneric): Breadcrumb[] {
  const parts = decodeURI(route.path).split('/').slice(1);
  return buildPath(parts, route).filter((part) => part.label.length > 0);
}

export function pathToRoute(route: RouteLocationNormalizedLoadedGeneric): string {
  return `/${trim(route.path)}${formatQuery(route.query)}`;
}

export function trim(path: string): string {
  return path.replace(/(^\/*)|(\/*$)/g, '');
}
