import Alpine from 'alpinejs';

import { config } from '@/scripts/config.ts';
import { datetime } from '@/scripts/datetime.ts';
import { http } from '@/scripts/http.ts';
import { EntryType } from '@/scripts/types/entry_type.ts';
import { breadcrumbify } from '@/scripts/util.ts';

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
      const res = await http.get(`${window.location.pathname.replace(/^\//, '')}${window.location.search}`);
      this.entries = res.data;
      this.breadcrumbs = breadcrumbify();
      console.log(this.breadcrumbs);
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

Alpine.magic('formatDate', () => (value: string): string => {
  const date = datetime(value);
  if (date.isValid()) return date.fromNow();
  return 'n/a';
});

Alpine.magic('route', () => (entry: EntityDetails): string => {
  if (entry.entry_type === EntryType.DIR) return entry.path;
  return `${config.server_url.replace(/\/*$/, '')}/${entry.path.replace(/^\/*/, '')}`;
});

function init(): void {
  Alpine.start();
}

export {
  Alpine,
  init,
};
