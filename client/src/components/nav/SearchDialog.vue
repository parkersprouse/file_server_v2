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

    <DialogContent class='sm:max-w-lg'>
      <DialogHeader>
        <DialogTitle>Search</DialogTitle>
        <DialogDescription>
          Use <code>*</code> as a wildcard
        </DialogDescription>
      </DialogHeader>

      <form
        class='flex flex-col gap-4'
        @submit.prevent='submit'
      >
        <input
          ref='query_input'
          v-model='query'
          type='text'
          name='search'
          placeholder='Search…'
          autocomplete='off'
          autocapitalize='off'
          spellcheck='false'
          class='flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-base
                 placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2
                 focus-visible:ring-ring'
        >

        <div class='grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 items-center'>
          <label class='text-sm text-muted-foreground' for='search-scope'>
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

          <label class='text-sm text-muted-foreground' for='search-match'>
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

        <div class='flex flex-row flex-wrap gap-2 justify-center items-center'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            class='ghost-ext'
            :class='{ "ghost-ext--active": case_sensitive }'
            :aria-pressed='case_sensitive'
            @click='case_sensitive = !case_sensitive'
          >
            <icon-text-aa aria-hidden='true' />
            Case sensitive
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            class='ghost-ext'
            :class='{ "ghost-ext--active": fuzzy }'
            :aria-pressed='fuzzy'
            @click='fuzzy = !fuzzy'
          >
            <icon-wave-sine aria-hidden='true' />
            Fuzzy
          </Button>
        </div>

        <DialogFooter class='gap-2'>
          <Button
            v-if='$router_store.searching'
            class='w-full'
            type='button'
            variant='outline'
            @click='clear'
          >
            Clear search
          </Button>
          <Button
            class='w-full'
            type='submit'
            :disabled='query.trim().length === 0'
          >
            <icon-magnifying-glass aria-hidden='true' />
            Search
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { nextTick, onMounted, onUnmounted, ref, useTemplateRef, watch } from 'vue';

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

// Seed the form from the active search (or the defaults) each time it opens.
watch(open, async (is_open) => {
  if (!is_open) return;
  set(case_sensitive, $router_store.search_case_sensitive);
  set(fuzzy, $router_store.search_fuzzy);
  set(match, $router_store.search_match);
  set(query, $router_store.search_query);
  set(scope, $router_store.search_scope);
  await nextTick();
  get(query_input)?.focus();
});

async function submit(): Promise<void> {
  if (get(query).trim().length === 0) return;
  await $router_store.updateSearch({
    case_sensitive: get(case_sensitive),
    fuzzy: get(fuzzy),
    match: get(match),
    query: get(query).trim(),
    scope: get(scope),
  });
  set(open, false);
}

async function clear(): Promise<void> {
  await $router_store.clearSearch();
  set(open, false);
}

function onKeydown(event: KeyboardEvent): void {
  if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
    event.preventDefault();
    set(open, !get(open));
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>
