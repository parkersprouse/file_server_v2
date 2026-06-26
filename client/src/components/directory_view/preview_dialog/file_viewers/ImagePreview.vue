<template>
  <!--
    Render every image (including SVGs) via <img>. Unlike <object>, an <img>
    does not execute <script> embedded in an SVG, so previewing a malicious SVG
    can't run code in the server's origin.

    The transform (pan/zoom/rotate) is applied here; the surrounding
    `.preview-dialog__content` is `overflow-hidden`, so it acts as the viewport
    that clips the zoomed image.
  -->
  <img
    ref='image'
    :src='entry.url'
    :style='image_style'
    draggable='false'
    @wheel.prevent='onWheel'
    @pointerdown='onPointerDown'
    @pointermove='onPointerMove'
    @pointerup='onPointerUp'
    @pointercancel='onPointerUp'
    @dblclick='onDoubleClick'
    @click.capture='onClickCapture'
    @dragstart.prevent
  >
</template>

<script setup lang='ts'>
import { get } from '@vueuse/core';
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from 'vue';

import { useImageView } from 'composables/image_view.ts';

import type { Entry } from 'types/entry.d.ts';
import type { CSSProperties } from 'vue';

const { entry } = defineProps<{
  entry: Entry;
}>();

// How far the pointer must move before a press counts as a pan (vs. a click).
const PAN_THRESHOLD = 3;
// Per-notch wheel zoom factor — gentler than the button step for fine control.
const WHEEL_STEP = 1.15;

const view = useImageView();
const image = useTemplateRef<HTMLImageElement>('image');

let pointer_id: number | undefined;
let start_x = 0;
let start_y = 0;
let start_offset_x = 0;
let start_offset_y = 0;
let did_pan = false;

const cursor = computed<string>(() => {
  if (view.scale <= 1) return 'default';
  return view.panning ? 'grabbing' : 'grab';
});

const image_style = computed<CSSProperties>(() => ({
  cursor: cursor.value,
  touchAction: view.scale > 1 ? 'none' : 'auto',
  transform: `translate(${view.offset_x}px, ${view.offset_y}px) ` +
    `scale(${view.scale}) rotate(${view.rotation}deg)`,
  // Skip the easing while dragging so panning tracks the cursor 1:1.
  transition: view.panning ? 'none' : 'transform 0.12s ease',
}));

function viewport(): HTMLElement | null {
  return get(image)?.parentElement ?? null;
}

// Clamp the pan so the image can never be dragged entirely out of the viewport.
// Uses untransformed `client*` sizes (stable under CSS transforms) and swaps the
// axes when the image is rotated a quarter turn.
function clampOffset(x: number, y: number): {
  x: number;
  y: number;
} {
  const img = get(image);
  const view_el = viewport();
  if (!img || !view_el) {
    return {
      x,
      y,
    };
  }

  const quarter_turned = Math.abs(view.rotation % 180) === 90;
  const visual_w = (quarter_turned ? img.clientHeight : img.clientWidth) * view.scale;
  const visual_h = (quarter_turned ? img.clientWidth : img.clientHeight) * view.scale;
  const max_x = Math.max(0, (visual_w - view_el.clientWidth) / 2);
  const max_y = Math.max(0, (visual_h - view_el.clientHeight) / 2);

  return {
    x: Math.min(max_x, Math.max(-max_x, x)),
    y: Math.min(max_y, Math.max(-max_y, y)),
  };
}


function applyOffset(x: number, y: number): void {
  const clamped = clampOffset(x, y);
  view.setOffset(clamped.x, clamped.y);
}

// Zoom to `next` while keeping the point at (client_x, client_y) anchored under
// the cursor. With a centered transform-origin, the on-screen vector from the
// image center scales by k, so the pan must shift to compensate.
function zoomToPoint(next: number, client_x: number, client_y: number): void {
  const view_el = viewport();
  const prev = view.scale;
  if (next === prev || !view_el) {
    view.setScale(next);
    return;
  }
  const k = next / prev;
  const rect = view_el.getBoundingClientRect();
  const focus_x = client_x - (rect.left + rect.width / 2);
  const focus_y = client_y - (rect.top + rect.height / 2);
  view.setScale(next);
  applyOffset(focus_x * (1 - k) + k * view.offset_x, focus_y * (1 - k) + k * view.offset_y);
}

function onWheel(event: WheelEvent): void {
  const factor = event.deltaY < 0 ? WHEEL_STEP : 1 / WHEEL_STEP;
  const next = Math.min(view.MAX_SCALE, Math.max(view.MIN_SCALE, view.scale * factor));
  zoomToPoint(next, event.clientX, event.clientY);
}

function onDoubleClick(event: MouseEvent): void {
  if (view.scale > 1) {
    view.reset();
    return;
  }
  zoomToPoint(2, event.clientX, event.clientY);
}

function onPointerDown(event: PointerEvent): void {
  // Only pan when zoomed in, and only with the primary button.
  if (view.scale <= 1 || event.button !== 0) return;
  const img = get(image);
  if (!img) return;

  pointer_id = event.pointerId;
  try {
    img.setPointerCapture(event.pointerId);
  } catch { /* capture is best-effort; panning still works without it */ }
  view.panning = true;
  did_pan = false;
  start_x = event.clientX;
  start_y = event.clientY;
  start_offset_x = view.offset_x;
  start_offset_y = view.offset_y;
  event.preventDefault();
}

function onPointerMove(event: PointerEvent): void {
  if (pointer_id !== event.pointerId || !view.panning) return;
  const dx = event.clientX - start_x;
  const dy = event.clientY - start_y;
  if (!did_pan && Math.hypot(dx, dy) > PAN_THRESHOLD) did_pan = true;
  applyOffset(start_offset_x + dx, start_offset_y + dy);
}

function onPointerUp(event: PointerEvent): void {
  if (pointer_id !== event.pointerId) return;
  const img = get(image);
  try {
    if (img?.hasPointerCapture(event.pointerId)) img.releasePointerCapture(event.pointerId);
  } catch { /* nothing to release */ }
  pointer_id = undefined;
  view.panning = false;
}

// Swallow the click that ends a pan so it doesn't bubble to the dialog's
// backdrop handler, which would otherwise close the preview.
function onClickCapture(event: MouseEvent): void {
  if (!did_pan) return;
  event.stopPropagation();
  event.preventDefault();
  did_pan = false;
}

// Every image starts at a clean fit view; never inherit another image's zoom.
watch(() => entry.url, () => view.reset());
onMounted(() => view.reset());
onBeforeUnmount(() => view.reset());
</script>

<style>
@reference '../../../../assets/styles/index.css';

@layer app {
  .preview-dialog {
    & .preview-dialog__content {
      & img {
        @apply max-w-full max-h-full object-contain select-none;

        will-change: transform;
        transform-origin: center center;
      }
    }

    &.preview-dialog--svg {
      & .preview-dialog__content {
        @apply h-auto w-auto grow shrink;

        & img {
          @apply w-full h-full;
        }
      }
    }
  }
}
</style>
