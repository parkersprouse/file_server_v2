import IconFont from '~icons/lucide/a-large-small';
import Icon3D from '~icons/lucide/axis-3d';
import IconBook from '~icons/lucide/book-open-text';
import IconSubtitle from '~icons/lucide/captions';
import IconChart from '~icons/lucide/chart-pie';
import IconDatabase from '~icons/lucide/database';
import IconFile from '~icons/lucide/file';
import IconArchive from '~icons/lucide/file-archive';
import IconFileDoc from '~icons/lucide/file-pen-line';
import IconFileUnknown from '~icons/lucide/file-question-mark';
import IconMetadata from '~icons/lucide/file-search';
import IconText from '~icons/lucide/file-text';
import IconFilmStrip from '~icons/lucide/film';
import IconGlobe from '~icons/lucide/globe';
import IconImage from '~icons/lucide/image';
import IconRom from '~icons/lucide/joystick';
import IconPlaylist from '~icons/lucide/list-music';
import IconPackage from '~icons/lucide/package';
import IconPresentation from '~icons/lucide/presentation';
import IconDisk from '~icons/lucide/save';
import IconMath from '~icons/lucide/square-function';
import IconTerminalWindow from '~icons/lucide/square-terminal';
import IconTable from '~icons/lucide/table';
import IconFolder from '~icons/lucide-extended/folder-filled';
import IconMusicNotesFill from '~icons/lucide-extended/music-filled';

import { EntryType } from 'enums/entry_type.ts';
import { FileType } from 'enums/file_type.ts';
import { QueryParam } from 'enums/query_param.ts';
import { checkSupport, features } from 'lib/browser.ts';
import { formatQuery, queryToObject, stripTransientParams } from 'lib/utils.ts';

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
    // Opening a folder from search results shows that folder's contents rather
    // than re-running the search inside it.
    query: {
      ...stripTransientParams(route.query),
    },
  } as RouteLocationNormalizedLoadedGeneric;
}

/**
 * An absolute, shareable URL for an entry. A folder links to its own page. A
 * file deep-links via its parent directory's path with the file's name in the
 * `linked` query param, which survives new siblings and re-sorting and breaks
 * if the file is moved or renamed.
 */
export function buildEntryLink(entry: Entry): string {
  // Encode per segment so the `/` separators are preserved (see `toFileUrl`).
  const encode_path = (path: string): string => path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  // Keep the viewer's view / sort params; search and direct-link state is
  // transient and must not leak into a shared link.
  const query = stripTransientParams(queryToObject(location.search));

  if (isDir(entry)) {
    return `${location.origin}${encode_path(entry.path)}${formatQuery(query)}`;
  }

  return `${location.origin}${encode_path(entryLocation(entry))}${formatQuery({
    ...query,
    // Raw name: `formatQuery` does the encoding.
    [QueryParam.LINKED]: entry.name,
  })}`;
}

/**
 * Whether an entry's preview dialog can be opened. Single source of truth for
 * both clicking a file entry and auto-opening a direct-linked file.
 */
export function canPreview(entry: Entry): boolean {
  return Boolean(entry.preview_type) && heicSupported(entry);
}

/**
 * The directory an entry lives in, as a display path ('/' for the root).
 * Used to show where a search result came from.
 */
export function entryLocation(entry: Entry): string {
  const index = entry.path.lastIndexOf('/');
  return index <= 0 ? '/' : entry.path.slice(0, index);
}

/** HEIC images are only previewable in browsers that can decode HEIF. */
export function heicSupported(entry: Entry): boolean {
  const is_heic = entry.full_type.endsWith('heic');
  return !is_heic || checkSupport(features.heif);
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
