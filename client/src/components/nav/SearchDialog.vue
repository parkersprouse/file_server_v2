<template>
  <Dialog v-model:open='open'>
    <DialogTrigger as-child>
      <Button
        variant='ghost'
        aria-label='Search files and folders'
        class='p-1.5! h-auto ghost-ext'
        :class='{
          "self-stretch": !$is_mobile,
          "ghost-ext--active": $router_store.searching,
        }'
      >
        <icon-magnifying-glass
          aria-hidden='true'
          :class='$is_mobile ? "size-8!" : "size-6!"'
        />
      </Button>
    </DialogTrigger>

    <DialogContent class='sm:max-w-lg max-h-full overflow-y-auto'>
      <DialogHeader>
        <DialogTitle>Search</DialogTitle>
        <DialogDescription>
          Use <code>*</code> as a wildcard
        </DialogDescription>
      </DialogHeader>

      <form
        class='flex flex-col gap-6'
        @submit.prevent='submit'
      >
        <InputGroup>
          <InputGroupInput
            v-model='query'
            ref='query_input'
            placeholder='Search…'
            autocomplete='off'
            autocapitalize='off'
            spellcheck='false'
          />
          <InputGroupAddon>
            <icon-magnifying-glass aria-hidden='true' />
          </InputGroupAddon>
        </InputGroup>

        <div class='grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 items-center'>
          <label class='text-sm text-muted-foreground text-right' for='search-scope'>
            Search in
          </label>
          <Select v-model='scope'>
            <SelectTrigger id='search-scope' class='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value='SearchScope.EVERYWHERE'>
                Everywhere
              </SelectItem>
              <SelectItem :value='SearchScope.RECURSIVE'>
                This folder &amp; subfolders
              </SelectItem>
              <SelectItem :value='SearchScope.CURRENT'>
                This folder only
              </SelectItem>
            </SelectContent>
          </Select>

          <label class='text-sm text-muted-foreground text-right' for='search-match'>
            Match
          </label>
          <Select v-model='match'>
            <SelectTrigger id='search-match' class='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem :value='SearchMatch.ALL'>
                Files &amp; folders
              </SelectItem>
              <SelectItem :value='SearchMatch.FILES'>
                Files only
              </SelectItem>
              <SelectItem :value='SearchMatch.DIRS'>
                Folders only
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class='flex flex-row flex-wrap gap-2 justify-evenly items-center'>
          <div class='flex items-center space-x-2'>
            <Switch
              v-model='case_sensitive'
              id='case-sensitivity'
            />
            <Label for='case-sensitivity'>Case Sensitive</Label>
          </div>

          <div class='flex items-center space-x-2'>
            <Switch
              v-model='fuzzy'
              id='fuzzy-search'
            />
            <Label for='fuzzy-search'>Fuzzy Search</Label>
          </div>
        </div>

        <DialogFooter class='flex-wrap gap-2'>
          <Button
            class='w-full text-sm'
            type='submit'
            :disabled='query.trim().length === 0'
          >
            <icon-magnifying-glass aria-hidden='true' />
            Search
          </Button>
          <Button
            v-if='$router_store.searching'
            class='w-full text-sm'
            type='button'
            variant='outline'
            @click='clear'
          >
            <icon-x-circle aria-hidden='true' />
            Clear search
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang='ts'>
import { get, onKeyDown, set } from '@vueuse/core';
import { nextTick, ref, useTemplateRef, watch } from 'vue';

import { useIsMobile } from 'composables/is_mobile.ts';
import { SearchMatch } from 'enums/search_match.ts';
import { SearchScope } from 'enums/search_scope.ts';
import { useRouterStore } from 'stores/router.ts';

const $is_mobile = useIsMobile();
const $router_store = useRouterStore();

const open = ref<boolean>(false);
const query_input = useTemplateRef('query_input');

const case_sensitive = ref<boolean>(false);
const fuzzy = ref<boolean>(false);
const match = ref<SearchMatch>(SearchMatch.ALL);
const query = ref<string>('');
const scope = ref<SearchScope>(SearchScope.RECURSIVE);

onKeyDown(
  (event) => event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey),
  (event) => {
    event.preventDefault();
    set(open, !get(open));
  },
  { dedupe: true },
);

// Seed the form from the active search (or the defaults) each time it opens.
watch(open, async (is_open) => {
  if (!is_open) return;
  set(case_sensitive, $router_store.search_case_sensitive);
  set(fuzzy, $router_store.search_fuzzy);
  set(match, $router_store.search_match);
  set(query, $router_store.search_query);
  set(scope, $router_store.search_scope);
  await nextTick();
  get(query_input)?.$el.focus();
});

async function submit(): Promise<void> {
  if (get(query).trim().length === 0) return;
  set(open, false);
  await $router_store.updateSearch({
    case_sensitive: get(case_sensitive),
    fuzzy: get(fuzzy),
    match: get(match),
    query: get(query).trim(),
    scope: get(scope),
  });
}

async function clear(): Promise<void> {
  set(open, false);
  await $router_store.clearSearch();
}
</script>
