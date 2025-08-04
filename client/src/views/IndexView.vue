<template>
  <NavBar />
  <main>
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

import type { EntryDetails } from '@/types/entry_details.js';

const error = ref(false);
const files = ref<EntryDetails[]>();
</script>
