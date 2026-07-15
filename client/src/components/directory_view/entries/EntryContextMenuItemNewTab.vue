<template>
  <ContextMenuItem
    as='a'
    :href='href'
    target='_blank'
  >
    <icon-arrow-square-out />
    Open in New Tab
  </ContextMenuItem>
</template>

<script setup lang='ts'>
const { href } = defineProps<{
  href: string;
}>();
</script>
