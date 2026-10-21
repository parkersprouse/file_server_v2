<script lang="ts" setup>
import CircleCheckIcon from "~icons/lucide/circle-check"
import PhCircleNotch from "~icons/lucide/loader-circle"
import InfoIcon from "~icons/lucide/info"
import TriangleAlertIcon from "~icons/lucide/triangle-alert"
import PhX from "~icons/lucide/x"
import OctagonXIcon from "~icons/lucide/circle-x"

import type { ToasterProps } from "vue-sonner"
import { reactiveOmit } from "@vueuse/core"
import { Toaster as Sonner } from "vue-sonner"
// vue-sonner 2.x no longer injects its styles automatically.
import "vue-sonner/style.css"
import { cn } from "@/lib/utils"

const props = defineProps<ToasterProps>()
const delegatedProps = reactiveOmit(props, "class", "toastOptions")
</script>

<template>
  <Sonner
    :class="cn('toaster group', props.class)"
    :style="{
      '--normal-bg': 'var(--popover)',
      '--normal-text': 'var(--popover-foreground)',
      '--normal-border': 'var(--border)',
      '--border-radius': 'var(--radius)',
      '--gray2': 'hsl(var(--popover) / 0.9)',
      '--gray3': 'var(--border)',
      '--gray4': 'var(--border)',
      '--gray5': 'var(--border)',
      '--gray12': 'var(--popover-foreground)',
    }"
    :toast-options="props.toastOptions ?? {
      classes: {
        toast: 'rounded-none!',
      },
    }"
    v-bind="delegatedProps"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-4" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <PhCircleNotch class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <PhX class="size-4" />
    </template>
  </Sonner>
</template>
