<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <span
    data-slot="dropdown-menu-shortcut"
    :class="cn('text-muted-foreground group-focus/dropdown-menu-item:text-accent-foreground ml-auto text-sm tracking-wide', props.class)"
  >
    <slot />
  </span>
</template>
