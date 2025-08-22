<template>
  <dialog
    ref='dialog'
    :class='cn("preview-dialog", props.class)'
    @click='async (event) => await onClickDialog(event)'
  >
    <PreviewDialogContent
      :class_content='file_component_attributes?.content?.class'
      :class_wrapper='file_component_attributes?.wrapper?.class'
    >
      <component
        v-if='entry'
        :is='file_component_name'
        v-bind='file_component_attributes?.content?.bindings ?? {}'
        ref='content_body'
      />
    </PreviewDialogContent>

    <PreviewDialogActions
      v-if='entry'
      :entry='entry'
    >
      <template
        v-if='Boolean(file_component_attributes?.actions?.start)'
        #actions_start
      >
        <template v-if='Array.isArray(file_component_attributes!.actions!.start)'>
          <component
            v-for='(ele, index) in file_component_attributes?.actions?.start'
            :key='`${index}.${ele.name}`'
            :is='ele'
          />
        </template>
        <component :is='file_component_attributes!.actions!.start' />
      </template>
      <template
        v-if='Boolean(file_component_attributes?.actions?.end)'
        #actions_end
      >
        <template v-if='Array.isArray(file_component_attributes!.actions!.end)'>
          <component
            v-for='(ele, index) in file_component_attributes!.actions!.end'
            :key='`${index}.${ele.name}`'
            :is='ele'
          />
        </template>
        <component :is='file_component_attributes!.actions!.end' />
      </template>
    </PreviewDialogActions>
  </dialog>
</template>

<script setup lang='ts'>
import '~icons/ph/circle-half';

import { get, onKeyStroke, set, useMutationObserver } from '@vueuse/core';
import { computed, h, onMounted, onUnmounted, ref, resolveComponent, useTemplateRef } from 'vue';

import 'components/directory_view/preview_dialog/file_viewers/AudioPreview.vue';
import 'components/directory_view/preview_dialog/file_viewers/DocumentPreview.vue';
import 'components/directory_view/preview_dialog/file_viewers/ImagePreview.vue';
import 'components/directory_view/preview_dialog/file_viewers/TextPreview.vue';
import 'components/directory_view/preview_dialog/file_viewers/VideoPreview.vue';
import 'components/ui/button/index.ts';
import { useEventBus } from 'composables/event_bus.ts';
import { capitalize, cn } from 'lib/utils.ts';

import type { UnsubscribeFunction } from 'emittery';
import type { Entry } from 'types/entry.d.ts';
import type { FileTypeAttrs } from 'types/file_type_attrs.d.ts';
import type { Component, HTMLAttributes } from 'vue';

const props = defineProps<{
  class?: HTMLAttributes['class'];
}>();

const $event_bus = useEventBus();
const event_unsubs = ref<UnsubscribeFunction[]>([]);

const content_body = useTemplateRef<Component>('content_body');
const dialog = useTemplateRef<HTMLDialogElement>('dialog');
const entry = ref<Entry>();
const file_component_attributes = ref<FileTypeAttrs>();
const is_open = ref<boolean>(false);

const file_component_name = computed<string | undefined>(() => {
  const file_entry = get(entry);
  if (!file_entry) return;
  return `${capitalize(file_entry.file_type)}Preview`;
});

onKeyStroke('Escape', async () => await close(), { dedupe: true });

useMutationObserver(dialog, (changes) => {
  const dialog_ele = changes[0].target as HTMLDialogElement;
  set(is_open, dialog_ele.hasAttribute('open'));
}, {
  attributeFilter: ['open'],
  subtree: false,
});

async function open(new_entry: Entry): Promise<void> {
  if (get(is_open)) return;
  const dialog_ele = get(dialog);
  if (!dialog_ele) return;
  document.body.classList.add('overflow-hidden!');
  set(entry, new_entry);
  const file_type_component = h(resolveComponent(get(file_component_name)!));
  // if (typeof file_type_component === 'string') return;
  console.log(file_type_component);
  console.log(typeof file_type_component);
  // console.log((file_type_component as typeof file_type_component).attributes);
  // set(
  //   file_component_attributes,
  //   (file_type_component as typeof file_type_component).attributes as FileTypeAttrs,
  // );
  console.log(get(file_component_attributes));
  dialog_ele.showModal();
}

async function close(): Promise<void> {
  if (!get(is_open)) return;
  const dialog_ele = get(dialog);
  if (!dialog_ele) return;
  set(entry, undefined);
  document.body.classList.remove('overflow-hidden!');
  dialog_ele.close();
}

async function onClickDialog(event: Event): Promise<void> {
  const target = event.target as HTMLDivElement;
  if (!target) return;
  if (['preview-dialog', 'preview-dialog__wrapper'].some((klass) => target.classList.contains(klass))) {
    await close();
  }
}

onMounted(() => {
  get(event_unsubs).push(
    $event_bus.on('show_dialog', async (new_entry) => await open(new_entry)),
    $event_bus.on('hide_dialog', async () => await close()),
  );
});

onUnmounted(() => {
  for (const unsub of get(event_unsubs)) unsub();
});
</script>

<style>
@reference '../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    @apply fixed left-1/2 top-1/2 -translate-1/2 hidden w-screen h-screen max-w-screen max-h-screen
           m-0 p-0 border-none z-[1000] cursor-pointer;

    &[open] {
      @apply flex flex-row flex-nowrap items-center justify-center;

      &::backdrop {
        @apply bg-black/85 z-[999] max-w-screen max-h-screen w-screen h-screen;
      }
    }

    & .preview-dialog__wrapper {
      @apply flex flex-col flex-nowrap items-center justify-center max-w-screen max-h-screen h-auto w-auto;

      & .preview-dialog__content {
        @apply flex flex-row flex-nowrap items-center justify-center
               w-auto h-auto max-w-full max-h-full overflow-auto cursor-auto;

        & img {
          @apply max-w-full max-h-full object-contain;
        }

        & video {
          @apply max-w-full max-h-full object-contain;
        }

        & object {
          @apply w-full h-full max-w-full max-h-full;
        }
      }
    }

    & .preview-dialog__actions {
      @apply flex flex-row flex-nowrap items-center justify-center
              gap-1 sm:gap-0 absolute right-0 top-0 bg-background
              border-l border-b border-zinc-300 dark:border-zinc-700;

      & svg.icon {
        @apply size-7 sm:size-6;
      }

      & a,
      & button {
        @apply text-muted-foreground;

        @variant hover {
          @apply text-primary;
        }
      }
    }
  }
}
</style>
