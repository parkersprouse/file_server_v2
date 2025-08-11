import type { EntryType } from 'enums/entry_type.ts';
import type { FileType } from 'enums/file_type.ts';

export type Entry = {
  created_at: string;
  duration: string;
  entry_type: EntryType;
  file_type: FileType;
  last_modified_at: string;
  name: string;
  path: string;
};
