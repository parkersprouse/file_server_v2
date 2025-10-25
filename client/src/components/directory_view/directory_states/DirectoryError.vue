<template>
  <section class='container pt-4'>
    <Empty>
      <EmptyHeader>
        <EmptyMedia class='text-cerise-red-300 dark:text-cerise-red-700'>
          <icon-warning class='size-14!' />
        </EmptyMedia>
        <EmptyTitle class='text-xl font-bold text-cerise-red-300 dark:text-cerise-red-700'>
          {{ title }}
        </EmptyTitle>
        <EmptyDescription>
          <div class='text-cerise-red-300 dark:text-cerise-red-700 text-base'>
            {{ message }}
          </div>
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
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
