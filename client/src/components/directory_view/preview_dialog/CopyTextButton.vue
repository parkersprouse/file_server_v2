<template>
  <Button
    variant='ghost'
    aria-label='Copy Text'
    class='ghost-ext h-auto!'
    @click='$emit("copy")'
  >
    <icon-check
      v-if='copied'
      class='text-shamrock-green-500! dark:text-shamrock-green-600!'
    />
    <icon-copy v-else />
  </Button>
</template>

<script setup lang='ts'>
import { get, set, useToggle } from '@vueuse/core';
import { onMounted, onUnmounted, ref } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';

import type { UnsubscribeFunction } from 'emittery';

defineEmits<{
  copy: undefined;
}>();

const [copied, toggleCopied] = useToggle();
const $event_bus = useEventBus();
const event_unsubs = ref<UnsubscribeFunction[]>([]);

const copied_timer = ref<number>();

async function showCopied(): Promise<void> {
  const existing_timer = get(copied_timer);
  if (existing_timer) clearTimeout(existing_timer);

  toggleCopied(true);
  set(copied_timer, setTimeout(() => {
    toggleCopied(false);
  }, 2000));
}

onMounted(() => {
  const onCopyText = $event_bus.on('text_copied', showCopied);
  get(event_unsubs).push(onCopyText);
});

onUnmounted(() => {
  for (const unsub of get(event_unsubs)) unsub();
});
</script>

<!--
<style>
@reference '../../../../assets/styles/index.css';

@utility text-copy-btn-visible {
  @apply inline-block opacity-100 pointer-events-auto hover:bg-zinc-200 hover:dark:bg-zinc-950;
}

.copyable {
  & .text-copy-btn {
    @apply absolute top-4 right-4 opacity-0 pointer-events-none w-auto h-auto p-1.5 rounded-[0.35rem]
           bg-transparent text-foreground border-zinc-950 border;

    transition: all 200ms ease;

    &.is-visible {
      @apply text-copy-btn-visible;
    }
  }

  @variant hover {
    & .text-copy-btn {
      @apply text-copy-btn-visible;
    }
  }
}
</style>
-->
