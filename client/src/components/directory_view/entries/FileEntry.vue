<template>
  <ContextMenu>
    <ContextMenuTrigger as-child>
      <a
        v-if='entry.external_url'
        :href='entry.external_url'
        class='entry'
        :class='{ "entry--linked": is_linked }'
        target='_blank'
      >
        <slot name='default' />
      </a>
      <a
        v-else-if='can_preview'
        ref='entry_ele'
        href='#'
        class='entry'
        :class='{ "entry--linked": is_linked }'
        @click.prevent='onClick'
      >
        <slot name='default' />
      </a>
      <a
        v-else
        :href='`${entry.url}?download`'
        download
        class='entry'
        :class='{ "entry--linked": is_linked }'
      >
        <slot name='default' />
      </a>
    </ContextMenuTrigger>
    <ContextMenuContent>
      <EntryContextMenuCopyLink :entry='entry' />
      <ContextMenuItem
        as='a'
        :href='`${entry.url}?inline`'
        target='_blank'
      >
        <icon-arrow-square-out />
        Open in New Tab
      </ContextMenuItem>
      <ContextMenuItem
        as='a'
        :href='`${entry.url}?download`'
        download
      >
        <icon-download-simple />
        Download
      </ContextMenuItem>
    </ContextMenuContent>
  </ContextMenu>
</template>

<script setup lang='ts'>
import { get } from '@vueuse/core';
import { computed, provide, useTemplateRef } from 'vue';

import { useEventBus } from 'composables/event_bus.ts';
import { canPreview, heicSupported } from 'lib/entry_helpers.ts';
import { useRouterStore } from 'stores/router.ts';

import type { Entry } from 'types/entry.d.ts';

const { entry } = defineProps<{
  entry: Entry;
}>();

const $event_bus = useEventBus();
const $router_store = useRouterStore();

const entry_ele = useTemplateRef('entry_ele');

const can_preview = computed<boolean>(() => canPreview(entry));

const is_linked = computed<boolean>(() =>
  $router_store.linked !== undefined && $router_store.linked === entry.name);

provide<boolean>('heic_check', heicSupported(entry));

async function onClick(): Promise<void> {
  // Opening a different entry's preview dismisses any active direct link.
  if (!get(is_linked)) await $router_store.clearLinked();
  $event_bus.emit('show_dialog', entry);
  get(entry_ele)?.blur();
}
</script>
