import type { EntryType } from 'enums/entry_type.ts';
import type { FileType } from 'enums/file_type.ts';
import type { PreviewType } from 'enums/preview_type.ts';

export type Entry = {
  created_at: string;
  created_at_epoch: number;
  duration: string;
  duration_order: number;
  duration_raw: number;
  entry_type: EntryType;
  file_type: FileType;
  full_type: string;
  last_modified_at: string;
  last_modified_at_epoch: number;
  name: string;
  name_lowercase: string;
  path: string;
  preview_type?: PreviewType;
  thumbnail: string | null;
  url: string;
};
