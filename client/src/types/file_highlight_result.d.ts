import type { LanguageMap } from 'prismjs';

export type FileHighlightResult = {
  inline_colors_present: boolean;
  language: keyof LanguageMap;
};
