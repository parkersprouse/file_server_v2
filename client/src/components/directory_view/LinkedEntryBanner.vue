<template>
  <section
    class='container flex flex-row flex-nowrap justify-between items-center gap-2 mb-4 px-4 py-2
           rounded-md border border-destructive/50 bg-destructive/10'
  >
    <div class='flex flex-row flex-nowrap items-center gap-2 min-w-0 text-sm'>
      <icon-link-break aria-hidden='true' class='shrink-0 size-4 text-destructive' />
      <span class='truncate'>
        The linked entry <strong>&ldquo;{{ name }}&rdquo;</strong> no longer exists or could not be found.
      </span>
    </div>

    <Button
      variant='ghost'
      size='sm'
      aria-label='Dismiss'
      class='shrink-0 p-1! h-auto ghost-ext'
      @click='$store.clearLinkedEntryError()'
    >
      <icon-x aria-hidden='true' class='size-4!' />
    </Button>
  </section>
</template>

<script setup lang='ts'>
import { useStore } from 'stores/global.ts';

defineProps<{
  name: string;
}>();

const $store = useStore();
</script>
