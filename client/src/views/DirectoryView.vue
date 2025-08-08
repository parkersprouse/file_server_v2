<template>
  <NavBar />

  <main
    class='z-0 mx-auto flex flex-col justify-start items-center
           px-4 w-full sm:w-xl md:w-2xl lg:w-4xl xl:w-6xl 2xl:w-7xl'
    :class='$is_mobile ? "scrollbar-hidden" : ""'
    :style='{ paddingTop: toolbar_height }'
  >
    <DirectoryError v-if='error' />
    <DirectoryLoading v-else-if='!files' />
    <DirectoryEmpty v-else-if='Boolean(files) && files.length === 0' />
    <DirectoryContent
      v-else
      :files='files'
    />
  </main>
</template>

<script setup lang='ts'>
import { computed, ref } from 'vue';

import { useStore } from '@/stores/global.ts';
import { useIsMobile } from 'composables/is_mobile.ts';

import type { EntryDetails } from 'types/entry_details.d.ts';

const $is_mobile = useIsMobile();
const $store = useStore();

const error = ref(false);
const files = ref<EntryDetails[]>([]);

const toolbar_height = computed<string>(() => `${$store.toolbar_height ?? 0}px`);
</script>
