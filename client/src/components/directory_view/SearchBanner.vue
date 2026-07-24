<template>
  <Alert class='container mb-4 max-w-9/10'>
    <icon-magnifying-glass aria-hidden='true' />
    <AlertTitle class='truncate'>
      <!-- explicit `{{ " " }}` spaces: whitespace between tags is condensed away -->
      <template v-if='count !== undefined'>
        {{ count }} {{ count === 1 ? "result" : "results" }} for{{ " " }}
      </template>
      <template v-else>
        Searching for{{ " " }}
      </template>
      <strong>&ldquo;{{ $router_store.search_query }}&rdquo;</strong>{{ " " }}{{ scope_label }}
    </AlertTitle>
    <AlertDescription
      v-if='has_badges'
      class='flex flex-row flex-wrap gap-x-2 gap-y-1'
    >
      <Badge
        v-if='$router_store.search_match !== SearchMatch.ALL'
        variant='secondary'
      >
        {{ $router_store.search_match === SearchMatch.FILES ? "files only" : "folders only" }}
      </Badge>
      <Badge
        v-if='$router_store.search_case_sensitive'
        variant='secondary'
      >
        case sensitive
      </Badge>
      <Badge
        v-if='$router_store.search_fuzzy'
        variant='secondary'
      >
        fuzzy
      </Badge>
      <Badge
        v-if='limit_reached'
        variant='secondary'
      >
        showing first {{ count }} matches
      </Badge>
    </AlertDescription>
    <AlertAction>
      <Button
        variant='ghost'
        size='sm'
        aria-label='Clear search'
        class='p-1! h-auto ghost-ext'
        @click='$router_store.clearSearch()'
      >
        <icon-x
          aria-hidden='true'
          class='size-4!'
        />
      </Button>
    </AlertAction>
  </Alert>
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

const has_badges = computed<boolean>(() => (
  $router_store.search_match !== SearchMatch.ALL ||
  $router_store.search_case_sensitive ||
  $router_store.search_fuzzy ||
  limit_reached.value
));

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
