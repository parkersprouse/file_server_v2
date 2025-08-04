import type { EntryType } from '@/scripts/types/entry_type.ts';

export type EntryDetails = {
  created_at: string;
  duration: string;
  entry_type: EntryType;
  file_type: string;
  last_modified_at: string;
  name: string;
  path: string;
};
