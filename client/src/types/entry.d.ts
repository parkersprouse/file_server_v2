import type { EntryType } from 'enums/entry_type.ts';
import type { FileType } from 'enums/file_type.ts';
import type { PreviewType } from 'enums/preview_type.ts';

export type Entry = {
  created_at: string;
  duration: string;
  entry_type: EntryType;
  file_type: FileType;
  full_type: string;
  last_modified_at: string;
  name: string;
  path: string;
  preview_type?: PreviewType;
  url: string;
};
