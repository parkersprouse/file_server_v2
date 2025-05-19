import Alpine from 'alpinejs';

import { config } from '@/scripts/config.ts';
import { datetime } from '@/scripts/datetime.ts';
import { http } from '@/scripts/http.ts';
import { EntryType } from '@/scripts/types/entry_type.ts';
import { SortDir } from '@/scripts/types/sort_dir.ts';
import { SortKey } from '@/scripts/types/sort_key.ts';
import { breadcrumbify, pathToRoute, trim } from '@/scripts/util.ts';

import type { Breadcrumb } from '@/scripts/types/breadcrumb.d.ts';
import type { EntityDetails } from '@/scripts/types/entry_details.d.ts';

window.Alpine = Alpine;

Alpine.data('theme', () => ({
  dark: window.localStorage.getItem('theme') === 'dark',

  init(): void {
    this.updateDOM();
  },

  toggle(): void {
    this.dark = !this.dark;
    window.localStorage.setItem('theme', this.dark ? 'dark' : 'light');
    this.updateDOM();
  },

  updateDOM(): void {
    if (this.dark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  },
}));

Alpine.data('files', () => ({
  breadcrumbs: null as null | Breadcrumb[],
  entries: null as null | EntityDetails[],
  error: false,

  async init(): Promise<void> {
    try {
      const res = await http.get(pathToRoute(window.location.pathname));
      this.entries = res.data;
      this.breadcrumbs = breadcrumbify();
    } catch {
      this.error = true;
    }
  },

  get at_root(): boolean {
    if (!this.breadcrumbs) return true;
    return this.breadcrumbs.length === 0;
  },

  get errored(): boolean {
    return this.error;
  },

  get empty(): boolean {
    return !this.errored && !this.loading && !this.present;
  },

  get loading(): boolean {
    return !this.errored && !Array.isArray(this.entries);
  },

  get present(): boolean {
    if (this.loading || this.errored) return false;
    return this.entries!.length > 0;
  },
}));

Alpine.store('sort', {
  dir: SortDir.ASC,
  key: SortKey.NAME,

  init(): void {
    const query = new URLSearchParams(window.location.search);
    this.dir = query.get('dir') ?? SortDir.ASC;
    this.key = query.get('key') ?? SortKey.NAME;
  },

  update(key: SortKey): void {
    let dir = SortDir.ASC;
    if (key === this.key) {
      if (this.dir === SortDir.ASC) dir = SortDir.DESC;
      else dir = SortDir.ASC;
    }

    window.location.search = new URLSearchParams({
      dir,
      key,
    }).toString();
  },

  checkActive(key: SortKey, dir: SortDir): boolean {
    return dir === this.dir && key === this.key;
  },
} as { [key: string | number | symbol]: unknown; });

Alpine.magic('formatDate', () => (value: string): string => {
  const date = datetime(value);
  if (date.isValid()) return date.fromNow();
  return 'n/a';
});

Alpine.magic('route', () => (entry: EntityDetails): string => {
  if (entry.entry_type === EntryType.DIR) return pathToRoute(entry.path);
  return `${trim(config.server_url)}${pathToRoute(entry.path)}`;
});

function init(): void {
  Alpine.start();
}

export {
  Alpine,
  init,
};
