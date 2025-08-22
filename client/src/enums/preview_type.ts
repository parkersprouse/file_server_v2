import { FileType } from 'enums/file_type.ts';

export enum PreviewType {
  AUDIO = FileType.AUDIO,
  DOCUMENT = FileType.DOCUMENT,
  IMAGE = FileType.IMAGE,
  SPREADSHEET = FileType.SPREADSHEET,
  TEXT = FileType.TEXT,
  VIDEO = FileType.VIDEO,
};
