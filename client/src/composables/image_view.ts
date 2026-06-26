import { computed, reactive, ref } from 'vue';

/**
 * Transient view state (zoom / rotation / pan) for the image preview.
 *
 * This is a module-level singleton — like the event bus — rather than Pinia
 * state, because it is deliberately ephemeral: it must NOT persist across
 * previews or reloads. `ImagePreview.vue` resets it whenever an image mounts,
 * unmounts, or changes; the preview toolbar drives it through the buttons.
 *
 * @example
 *   import { useImageView } from 'composables/image_view.ts';
 *   ...
 *   const view = useImageView();
 *   view.zoomIn();
 *   <img :style='{ transform: `scale(${view.scale})` }'>
 */

const MIN_SCALE = 1;
const MAX_SCALE = 8;
// Multiplicative step so each click feels proportional at any zoom level.
const ZOOM_STEP = 1.25;
// Snap-to-fit tolerance so float drift never leaves us stuck just above 1x.
const SCALE_EPSILON = 0.001;

const scale = ref<number>(1);
const rotation = ref<number>(0); // degrees, always a multiple of 90
const offset_x = ref<number>(0); // pan, in screen px
const offset_y = ref<number>(0);
const panning = ref<boolean>(false);

const zoom_percent = computed<number>(() => Math.round(scale.value * 100));
const can_zoom_in = computed<boolean>(() => scale.value < MAX_SCALE);
const can_zoom_out = computed<boolean>(() => scale.value > MIN_SCALE);
// Whether the view has been moved off its default "fit" state, so the Reset
// control has something to undo.
const is_transformed = computed<boolean>(() =>
  scale.value !== 1 || rotation.value !== 0 || offset_x.value !== 0 || offset_y.value !== 0);

function clampScale(value: number): number {
  if (Math.abs(value - 1) < SCALE_EPSILON) return 1;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, value));
}

function setScale(value: number): void {
  const next = clampScale(value);
  scale.value = next;
  // Back at fit there is nothing to pan, so re-center.
  if (next === 1) {
    offset_x.value = 0;
    offset_y.value = 0;
  }
}

function zoomIn(): void {
  setScale(scale.value * ZOOM_STEP);
}

function zoomOut(): void {
  setScale(scale.value / ZOOM_STEP);
}

function setOffset(x: number, y: number): void {
  offset_x.value = x;
  offset_y.value = y;
}

function rotateCw(): void {
  rotation.value += 90;
}

function rotateCcw(): void {
  rotation.value -= 90;
}

function reset(): void {
  scale.value = 1;
  rotation.value = 0;
  offset_x.value = 0;
  offset_y.value = 0;
  panning.value = false;
}

// `reactive` unwraps the refs/computeds at the top level, so consumers (and
// templates) can read `view.scale` / `view.zoom_percent` directly.
const view = reactive({
  /*-- State --*/
  offset_x,
  offset_y,
  panning,
  rotation,
  scale,

  /*-- Computed --*/
  can_zoom_in,
  can_zoom_out,
  is_transformed,
  zoom_percent,

  /*-- Constants --*/
  MAX_SCALE,
  MIN_SCALE,

  /*-- Methods --*/
  reset,
  rotateCcw,
  rotateCw,
  setOffset,
  setScale,
  zoomIn,
  zoomOut,
});

export type ImageView = typeof view;

export function useImageView(): ImageView {
  return view;
}
