import type { PreviewType } from 'enums/preview_type.ts';
import type { PreviewTypeAttrs } from 'types/preview_type_attrs.d.ts';

export type PreviewTypeAttrsMapping = {
  [index in PreviewType]: PreviewTypeAttrs;
};
