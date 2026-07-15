<template>
  <section
    class='container flex flex-row flex-nowrap justify-between items-center gap-2 mb-4 px-4 py-2
           rounded-md border border-muted bg-muted/50'
  >
    <div class='flex flex-row flex-wrap items-center gap-x-2 gap-y-1 min-w-0 text-sm'>
      <icon-magnifying-glass aria-hidden='true' class='shrink-0 size-4 text-muted-foreground' />
      <span class='truncate'>
        <!-- explicit `{{ " " }}` spaces: whitespace between tags is condensed away -->
        <template
          v-if='count !== undefined'
        >{{ count }} {{ count === 1 ? "result" : "results" }} for{{ " " }}</template>
        <template v-else>Searching for{{ " " }}</template>
        <strong>&ldquo;{{ $router_store.search_query }}&rdquo;</strong>{{ " " }}{{ scope_label }}
      </span>
      <Badge
        v-if='$router_store.search_match !== SearchMatch.ALL'
        variant='outline'
      >
        {{ $router_store.search_match === SearchMatch.FILES ? "files only" : "folders only" }}
      </Badge>
      <Badge
        v-if='$router_store.search_case_sensitive'
        variant='outline'
      >
        case sensitive
      </Badge>
      <Badge
        v-if='$router_store.search_fuzzy'
        variant='outline'
      >
        fuzzy
      </Badge>
      <Badge
        v-if='limit_reached'
        variant='outline'
        class='text-muted-foreground'
      >
        showing first {{ count }} matches
      </Badge>
    </div>

    <Button
      variant='ghost'
      size='sm'
      aria-label='Clear search'
      class='shrink-0 p-1! h-auto ghost-ext'
      @click='$router_store.clearSearch()'
    >
      <icon-x aria-hidden='true' class='size-4!' />
    </Button>
  </section>
</template>

<script setup lang='ts'>
import { computed } from 'vue';

import { SearchMatch } from 'enums/search_match.ts';
import { SearchScope } from 'enums/search_scope.ts';
import { useRouterStore } from 'stores/router.ts';

// `undefined` means the results are still loading.
const { count } = defineProps<{
  count: number | undefined;
}>();

const $router_store = useRouterStore();

// Results are capped server-side; a full page of matches means there may be more.
const SERVER_RESULT_LIMIT = 500;

const limit_reached = computed<boolean>(() => (count ?? 0) >= SERVER_RESULT_LIMIT);

const scope_label = computed<string>(() => {
  switch ($router_store.search_scope) {
    case SearchScope.EVERYWHERE: {
      return 'everywhere';
    }
    case SearchScope.CURRENT: {
      return 'in this folder';
    }
    default: {
      return 'in this folder & subfolders';
    }
  }
});
</script>
