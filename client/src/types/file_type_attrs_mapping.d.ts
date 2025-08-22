import type { FileType } from 'enums/file_type.ts';
import type { FileTypeAttrs } from 'types/file_type_attrs.d.ts';

export type FileTypeAttrsMapping = {
  [index in FileType]: FileTypeAttrs;
};
