import type { Breadcrumb } from '@/scripts/types/breadcrumb.d.ts';

export function breadcrumbify(): Breadcrumb[] {
  const parts = decodeURI(window.location.pathname).split('/').slice(1);
  return parts.map((part, index) => ({
    label: part,
    path: index < parts.length - 1 ?
      `/${parts.slice(0, index - 1).join('/')}${window.location.search}` :
      undefined,
  })).filter((part) => part.label.length > 0);
}

export function pathToRoute(path: string): string {
  return `/${trim(path)}${window.location.search}`;
}

export function trim(path: string): string {
  return path.replace(/(^\/*)|(\/*$)/g, '');
}
