<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div
    ref='content_ref'
    class='tooltip hidden'
    role='tooltip'
    style='top: 0; left: 0;'
  >
    <div v-html='content' />
    <div
      ref='arrow_ref'
      class='tooltip__arrow'
    />
  </div>
</template>

<script setup lang='ts'>
import {
  arrow,
  computePosition,
  flip,
  shift,
} from '@floating-ui/dom';
import { get, set } from '@vueuse/core';
import { ref, useTemplateRef, watch } from 'vue';

import { useStore } from 'stores/global.ts';

import type { Middleware } from '@floating-ui/dom';
import type { TooltipPayload } from 'types/tooltip_payload.d.ts';

const $store = useStore();

const content = ref<string>();
const arrow_ref = useTemplateRef('arrow_ref');
const content_ref = useTemplateRef('content_ref');

watch(() => $store.tooltip_content, async (new_value: string | TooltipPayload | undefined) => {
  if (!new_value) return;
  if (typeof new_value === 'string') buildTooltip({ value: new_value });
  else await buildTooltip(new_value);
});

async function buildTooltip(payload: TooltipPayload): Promise<void> {
  const parsed_payload: TooltipPayload = defaults(payload);
  const { placement, strategy, value }: TooltipPayload = parsed_payload;

  set(content, value);

  const trigger_ele = $store.tooltip_trigger;
  const content_ele = get(content_ref);
  const arrow_ele = get(arrow_ref);
  if (!trigger_ele || !content_ele) return;

  const { x, y, placement: new_placement, middlewareData } = await computePosition(trigger_ele, content_ele, {
    middleware: getMiddleware(parsed_payload),
    placement,
    strategy,
  });

  Object.assign(content_ele.style, {
    left: x,
    top: y,
  });

  if (arrow_ele) {
    const arrow_x = middlewareData.arrow?.x;
    const arrow_y = middlewareData.arrow?.y;
    const static_side: string = {
      bottom: 'top',
      left: 'right',
      right: 'left',
      top: 'bottom',
    }[new_placement.split('-')[0]] as string;

    /* eslint-disable eqeqeq -- as directed by official documentation */
    Object.assign(arrow_ele.style, {
      bottom: '',
      left: arrow_x != null ? `${arrow_x}px` : '',
      right: '',
      [static_side]: '-4px',
      top: arrow_y != null ? `${arrow_y}px` : '',
    });
    /* eslint-enable eqeqeq */
  }
}

function getMiddleware(payload: TooltipPayload): Middleware[] {
  const { arrow_opts, flip_opts, shift_opts } = payload;

  const middleware = [
    flip(flip_opts),
    shift(shift_opts),
  ];

  const arrow_ele = get(arrow_ref);
  if (arrow_ele) {
    middleware.push(arrow({
      element: arrow_ele,
      ...arrow_opts,
    }));
  }

  return middleware;
}

function defaults(payload: TooltipPayload): TooltipPayload {
  return {
    arrow_opts: {
      ...payload.arrow_opts || {},
    },
    flip_opts: {
      crossAxis: 'alignment',
      fallbackAxisSideDirection: 'end',
      fallbackStrategy: 'initialPlacement',
      ...payload.flip_opts || {},
    },
    placement: payload.placement || 'top',
    shift_opts: {
      ...payload.shift_opts || {},
    },
    strategy: payload.strategy || 'absolute',
    value: payload.value,
  };
}
</script>

<style>
@reference '../assets/styles/index.css';

.tooltip {
  @apply absolute
    bg-popover
    border
    hidden
    overflow-hidden
    px-3
    py-1.5
    rounded-none
    shadow-md
    text-popover-foreground
    text-sm
    w-max
    z-[850];

  & .tooltip__arrow {
    @apply absolute w-2 h-2 rotate-45 bg-popover;
  }
}
</style>
