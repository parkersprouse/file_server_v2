import { pipe, prop, sortBy } from 'remeda';

import { SortDir } from 'enums/sort_dir.ts';
import { SortKey } from 'enums/sort_key.ts';

import type { Entry } from 'types/entry';

/* https://github.com/remeda/remeda/blob/main/packages/remeda/src/internal/purryOrderRules.ts */
type ComparablePrimitive = bigint | boolean | number | string;

// We define the Comparable based on how JS coerces values into primitives when used with the `<` and `>` operators.
// @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#type_coercion
type Comparable =
  ComparablePrimitive |
  { [Symbol.toPrimitive]: (hint: string) => ComparablePrimitive; } |
  { toString: () => string; } |
  { valueOf: () => ComparablePrimitive; };

type Projection<T> = (x: T) => Comparable;


export function sortEntries(
  entries: Entry[],
  sort_key: SortKey,
  // Callers pass `routerStore.dir`, which is already validated against the
  // `SortDir` enum by the store.
  sort_dir: SortDir = SortDir.DESC,
): Entry[] {
  const criteria: [projection: Projection<Entry>, direction: SortDir][] = [];

  switch (sort_key) {
    case SortKey.CREATED: {
      criteria.push(
        [prop('created_at_epoch'), sort_dir],
        [prop('name_lowercase'), SortDir.ASC],
      );
      break;
    }

    case SortKey.DURATION: {
      criteria.push(
        [prop('duration_order'), SortDir.ASC],
        [prop('duration_raw'), sort_dir],
        [prop('name_lowercase'), SortDir.ASC],
      );
      break;
    }

    case SortKey.MODIFIED: {
      criteria.push(
        [prop('last_modified_at_epoch'), sort_dir],
        [prop('name_lowercase'), SortDir.ASC],
      );
      break;
    }

    default: {
      criteria.push([prop('name_lowercase'), sort_dir]);
      break;
    }
  }

  // Directories always sort above files; the per-key criteria break ties.
  return pipe(
    entries,
    sortBy(
      [prop('entry_type'), SortDir.ASC],
      ...criteria,
    ),
  );
}
