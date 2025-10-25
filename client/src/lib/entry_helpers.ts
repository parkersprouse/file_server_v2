import IconBook from '~icons/ph/book-open-text';
import IconChart from '~icons/ph/chart-pie';
import IconSubtitle from '~icons/ph/closed-captioning';
import IconDatabase from '~icons/ph/database';
import IconFile from '~icons/ph/file';
import IconArchive from '~icons/ph/file-archive';
import IconFileUnknown from '~icons/ph/file-dashed';
import IconFileDoc from '~icons/ph/file-doc';
import IconMetadata from '~icons/ph/file-magnifying-glass';
import IconText from '~icons/ph/file-text';
import IconFilmStrip from '~icons/ph/film-strip';
import IconDisk from '~icons/ph/floppy-disk';
import IconFolder from '~icons/ph/folder-simple-fill';
import IconMath from '~icons/ph/function';
import IconGlobe from '~icons/ph/globe';
import IconImage from '~icons/ph/image';
import IconRom from '~icons/ph/joystick';
import IconMusicNotesFill from '~icons/ph/music-notes-fill';
import IconPackage from '~icons/ph/package';
import IconPlaylist from '~icons/ph/playlist';
import IconPresentation from '~icons/ph/projector-screen-chart';
import IconTable from '~icons/ph/table';
import IconTerminalWindow from '~icons/ph/terminal-window';
import IconFont from '~icons/ph/text-aa';
import Icon3D from '~icons/ph/vector-three';

import { config } from '@/config.ts';
import { EntryType } from 'enums/entry_type.ts';
import { FileType } from 'enums/file_type.ts';
import { trim } from 'lib/utils.ts';

// import type { SortDir } from 'enums/sort_dir.ts';
// import type { SortKey } from 'enums/sort_key.ts';
import type { Entry } from 'types/entry.d.ts';
import type { FunctionalComponent } from 'vue';
import type { RouteLocationNormalizedLoadedGeneric } from 'vue-router';

const ICON_MAPPING = {
  [EntryType.DIR]: IconFolder,

  [FileType.ARCHIVE]: IconArchive,
  [FileType.AUDIO]: IconMusicNotesFill,
  [FileType.COMPRESSED]: IconArchive,
  [FileType.DATABASE]: IconDatabase,
  [FileType.DIAGRAM]: IconChart,
  [FileType.DOCUMENT]: IconFileDoc,
  [FileType.EBOOK]: IconBook,
  [FileType.EXECUTABLE]: IconTerminalWindow,
  [FileType.FILE]: IconFile,
  [FileType.FONT]: IconFont,
  [FileType.FORMULA]: IconMath,
  [FileType.GEOSPATIAL]: IconGlobe,
  [FileType.IMAGE]: IconImage,
  [FileType.METADATA]: IconMetadata,
  [FileType.MODEL]: Icon3D,
  [FileType.PACKAGE]: IconPackage,
  [FileType.PLAYLIST]: IconPlaylist,
  [FileType.PRESENTATION]: IconPresentation,
  [FileType.ROM]: IconRom,
  [FileType.SPREADSHEET]: IconTable,
  [FileType.SUBTITLE]: IconSubtitle,
  [FileType.TEXT]: IconText,
  [FileType.UNKNOWN]: IconFileUnknown,
  [FileType.VDISK]: IconDisk,
  [FileType.VIDEO]: IconFilmStrip,
};

export function buildEntryRoute(
  entry: Entry,
  route: RouteLocationNormalizedLoadedGeneric,
): RouteLocationNormalizedLoadedGeneric {
  return {
    path: entry.path,
    query: {
      ...route.query,
    },
  } as RouteLocationNormalizedLoadedGeneric;
}

export function fileTypeToIcon(type: FileType | EntryType): FunctionalComponent {
  return ICON_MAPPING[type];
}

export function isDir(entry: Entry): boolean {
  return entry.entry_type === EntryType.DIR;
}

export function isFile(entry: Entry): boolean {
  return entry.entry_type === EntryType.FILE;
}

// export function sortByDir(entries: Entry[], dir: SortDir): Entry[] {
//   const sorted = [...entries].sort((a: Entry, b: Entry) => {

//   });

//   return sortDirectoriesTop(sorted);
// }

// export function sortByKey(entries: Entry[], key: SortKey): Entry[] {
//   return sortDirectoriesTop(entries);
// }

// export function sortDirectoriesTop(entries: Entry[]): Entry[] {
//   return [...entries].sort((a: Entry, b: Entry) => {
//     if (isDir(a) && isFile(b)) return -1;
//     if (isFile(a) && isDir(b)) return 1;
//     return 0;
//   });
// }

export function toFileUrl(entry: Entry): string {
  return `${trim(config.server_url)}/${trim(entry.path)}`;
}
