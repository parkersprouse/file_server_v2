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
 * An absolute, shareable URL that deep-links to an entry: its parent
 * directory's path with the entry's name in the `linked` query param. The
 * link survives new siblings and re-sorting, and breaks if the entry is
 * moved or renamed.
 */
export function buildEntryLink(entry: Entry): string {
  // Encode per segment so the `/` separators are preserved (see `toFileUrl`).
  const parent = entryLocation(entry)
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
  const query = {
    ...queryToObject(location.search),
    [QueryParam.LINKED]: encodeURIComponent(entry.name),
  };
  return `${location.origin}${parent}${formatQuery(query)}`;
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
