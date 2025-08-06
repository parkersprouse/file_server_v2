<template>
  <NavBar />

  <main
    class='mx-auto flex flex-col justify-start items-center px-4 w-full sm:w-xl md:w-2xl lg:w-4xl xl:w-6xl 2xl:w-7xl'
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
import { ref } from 'vue';

import type { EntryDetails } from 'types/entry_details.d.ts';

const error = ref(false);
const files = ref<EntryDetails[]>([]);
</script>
