<template>
  <section class='container pt-4'>
    <Empty>
      <EmptyHeader>
        <EmptyMedia class='text-accent-text'>
          <icon-warning class='size-14!' />
        </EmptyMedia>
        <EmptyTitle class='text-xl font-bold text-accent-text'>
          {{ title }}
        </EmptyTitle>
        <EmptyDescription>
          <div class='text-accent-text text-base'>
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
