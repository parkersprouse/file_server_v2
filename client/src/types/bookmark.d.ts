import type { FileType } from 'enums/file_type.ts';

export type Bookmark = {
  added_at: number;
  // Absent for a folder.
  file_type?: FileType;
  name: string;
  // Absolute display path with forward slashes, e.g. `/music/album/song.mp3`.
  path: string;
};
