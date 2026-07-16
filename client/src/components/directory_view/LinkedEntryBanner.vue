<template>
  <Alert variant='destructive' class='container mb-4 max-w-9/10'>
    <icon-link-break aria-hidden='true' />
    <AlertTitle class='truncate'>
      The linked entry <strong>&ldquo;{{ name }}&rdquo;</strong> no longer exists or could not be found.
    </AlertTitle>
    <AlertAction>
      <Button
        variant='ghost'
        size='sm'
        aria-label='Dismiss'
        class='p-1! h-auto ghost-ext'
        @click='$store.clearLinkedEntryError()'
      >
        <icon-x aria-hidden='true' class='size-4!' />
      </Button>
    </AlertAction>
  </Alert>
</template>

<script setup lang='ts'>
import { useStore } from 'stores/global.ts';

defineProps<{
  name: string;
}>();

const $store = useStore();
</script>
