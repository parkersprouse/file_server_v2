<!--
  "Install app": shown only while the app can be installed and isn't already
  running installed (`display-mode: standalone`). Chromium browsers get their
  native install prompt; iOS has no install event, so there the button opens
  Add to Home Screen instructions instead.
-->

<template>
  <Button
    v-if='available'
    variant='ghost'
    class='ghost-ext h-auto'
    :class='labelled ? "gap-3 text-base" : "p-1.5! self-stretch"'
    :aria-label='labelled ? undefined : "Install app"'
    :title='labelled ? undefined : "Install app"'
    @click='onInstall'
  >
    <icon-monitor-down
      aria-hidden='true'
      class='size-6!'
    />
    <template v-if='labelled'>
      Install app
    </template>
  </Button>

  <Dialog v-model:open='instructions_open'>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Install on this device</DialogTitle>
        <DialogDescription>
          This browser installs apps from its Share menu:
        </DialogDescription>
      </DialogHeader>
      <ol class='list-decimal pl-6 flex flex-col gap-2 text-sm'>
        <li>
          Tap <icon-share aria-hidden='true' class='inline size-4! align-text-bottom' />
          <strong> Share</strong> in the browser's toolbar.
        </li>
        <li>Choose <strong>Add to Home Screen</strong>.</li>
        <li>Tap <strong>Add</strong>, then open File Browser from the Home Screen.</li>
      </ol>
    </DialogContent>
  </Dialog>
</template>

<script setup lang='ts'>
import { ref } from 'vue';

import { usePwaInstall } from 'composables/pwa.ts';
import { Button } from 'ui/button/index.ts';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from 'ui/dialog/index.ts';

// `labelled` renders the icon with its text (the mobile settings sheet); the
// desktop navbar shows the icon alone.
const { labelled = false } = defineProps<{
  labelled?: boolean;
}>();

const { available, install, manual } = usePwaInstall();
const instructions_open = ref<boolean>(false);

async function onInstall(): Promise<void> {
  if (await install()) return;
  if (manual) instructions_open.value = true;
}
</script>
