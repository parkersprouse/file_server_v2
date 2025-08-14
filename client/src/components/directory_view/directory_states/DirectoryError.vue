<template>
  <section class='pt-4 w-full'>
    <Alert
      class='bg-red-200 text-cerise-red-300! dark:bg-red-950 dark:text-cerise-red-700!'
      variant='destructive'
    >
      <icon-warning />
      <AlertTitle class='text-cerise-red-300! dark:text-cerise-red-700! font-bold'>
        {{ title }}
      </AlertTitle>
      <AlertDescription class='text-cerise-red-300! dark:text-cerise-red-700!'>
        {{ message }}
      </AlertDescription>
    </Alert>
  </section>
</template>

<script setup lang='ts'>
const {
  message = 'There was a problem loading the requested path',
  title = 'Failed to load',
} = defineProps<{
  message?: string;
  title?: string;
}>();
</script>
