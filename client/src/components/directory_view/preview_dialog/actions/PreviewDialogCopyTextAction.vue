<template>
  <Tooltip
    :delay-duration='250'
    :disable-closing-trigger='true'
    :disable-hoverable-content='true'
    :skip-delay-duration='300'
  >
    <TooltipTrigger as-child>
      <Button
        variant='ghost'
        aria-label='Copy Text'
        class='ghost-ext h-auto! copy-text-dialog-action'
        :class='{
          failed: failed_copy,
          successful: successful_copy,
        }'
        @click='async () => await $event_bus.emit("copy_text")'
      >
        <icon-check v-if='successful_copy' />
        <icon-warning v-else-if='failed_copy' />
        <icon-clipboard v-else />
      </Button>
    </TooltipTrigger>
    <TooltipContent
      side='bottom'
      to='.preview-dialog__actions'
    >
      <div class='text-center'>
        {{ tooltip_text }}
      </div>
    </TooltipContent>
  </Tooltip>
</template>

<script setup lang='ts'>
import { get, set, useToggle } from '@vueuse/core';
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';

import type { UnsubscribeFunction } from 'emittery';

const [copied, toggleCopied] = useToggle();
const $event_bus = useEventBus();
const event_unsubs = ref<UnsubscribeFunction[]>([]);

const copied_timer = ref<number>();
const copy_success = ref<boolean | null>();

const failed_copy = computed<boolean>(() => get(copied) && get(copy_success) === false);
const successful_copy = computed<boolean>(() => get(copied) && get(copy_success) === true);
const tooltip_text = computed<string>(() => {
  if (get(successful_copy)) return 'Copied!';
  if (get(failed_copy)) return 'Failed to copy';
  return 'Copy File Contents';
});

async function showCopied(successful: boolean): Promise<void> {
  const existing_timer = get(copied_timer);
  if (existing_timer) clearTimeout(existing_timer);
  set(copy_success, successful);

  toggleCopied(true);
  set(copied_timer, setTimeout(() => {
    toggleCopied(false);
    set(copy_success, null);
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

<style>
@reference '../../../../assets/styles/index.css';

.copy-text-dialog-action {
  &.successful {
    @apply text-shamrock-green-500! dark:text-shamrock-green-600!;

    & * {
      @apply text-shamrock-green-500! dark:text-shamrock-green-600!;
    }
  }

  &.failed {
    @apply text-red-500! dark:text-red-400!;

    & * {
      @apply text-red-500! dark:text-red-400!;
    }
  }

  @variant hover {
    &.successful {
      @apply text-shamrock-green-500! dark:text-shamrock-green-600!;

      & * {
        @apply text-shamrock-green-500! dark:text-shamrock-green-600!;
      }
    }

    &.failed {
      @apply text-red-500! dark:text-red-400!;

      & * {
        @apply text-red-500! dark:text-red-400!;
      }
    }
  }
}
</style>
