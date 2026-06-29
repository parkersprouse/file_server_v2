export type FileHighlightResult = {
  inline_colors_present: boolean;
  // Shiki language id the previewed file was highlighted as ('text' when unknown).
  language: string;
};
