import type { SearchMatch } from 'enums/search_match.ts';
import type { SearchScope } from 'enums/search_scope.ts';

export type SearchOptions = {
  case_sensitive: boolean;
  fuzzy: boolean;
  match: SearchMatch;
  query: string;
  scope: SearchScope;
};
