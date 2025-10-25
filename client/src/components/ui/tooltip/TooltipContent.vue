<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { reactiveOmit } from '@vueuse/core'
import { TooltipArrow, TooltipContent, type TooltipContentEmits, type TooltipContentProps, TooltipPortal, useForwardPropsEmits } from 'reka-ui'
import { cn } from '@/lib/utils'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(defineProps<
  TooltipContentProps &
  {
    class?: HTMLAttributes['class'],
    to?: string | HTMLElement,
  }
>(), {
  to: undefined,
  sideOffset: 4,
})

const emits = defineEmits<TooltipContentEmits>()

const delegatedProps = reactiveOmit(props, 'class')
const forwarded = useForwardPropsEmits(delegatedProps, emits)
const { to, ...content_props } = forwarded.value;
</script>

<template>
  <TooltipPortal :to='to'>
    <TooltipContent
      data-slot="tooltip-content"
      v-bind="{ ...content_props, ...$attrs }"
      :class="cn('bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-1100 w-fit rounded-md px-2 py-1 text-xs text-balance', props.class)"
    >
      <slot />

      <TooltipArrow class="bg-primary fill-primary z-1100 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-[2px]" />
    </TooltipContent>
  </TooltipPortal>
</template>
