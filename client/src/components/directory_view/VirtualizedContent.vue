<template>
  <section
    ref='scroll_container_ref'
    class='container virtualized-content'
    :class='{
      "px-0! mx-0! w-full! max-w-none!": view === ViewType.LIST,
    }'
  >
    <!-- Spacer for items before visible range -->
    <div
      v-if='view !== ViewType.GRID'
      :style='{ height: `${offset_top}px` }'
      class='virtual-spacer-top'
    />

    <!-- Grid spacer (requires different approach due to flexbox wrapping) -->
    <template v-if='view === ViewType.GRID'>
      <!-- Grid items will be rendered normally; CSS columns handle wrapping -->
      <div class='virtual-grid-container'>
        <EntryItem
          v-for='entry in visible_entries'
          :key='encodeURI(entry.path)'
          :entry='entry'
        >
          <GridItem :entry='entry' />
        </EntryItem>
      </div>
    </template>

    <!-- List/Row view -->
    <template v-else>
      <div :class='`entries--${mode}`'>
        <EntryItem
          v-for='entry in visible_entries'
          :key='encodeURI(entry.path)'
          :entry='entry'
        >
          <component
            :is='layout_mapping[mode]'
            :entry='entry'
          />
        </EntryItem>
      </div>
    </template>

    <!-- Spacer for items after visible range -->
    <div
      v-if='view !== ViewType.GRID'
      :style='{ height: `${offset_bottom}px` }'
      class='virtual-spacer-bottom'
    />

    <!-- Invisible spacer for grid to maintain scroll height -->
    <div
      v-if='view === ViewType.GRID'
      :style='{ height: `${total_scroll_height - rendered_height}px` }'
      class='virtual-spacer-bottom'
    />
  </section>
</template>

<script setup lang='ts'>
import { get, set } from '@vueuse/core';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import EntryItem from 'components/directory_view/EntryItem.vue';
import GridItem from 'components/directory_view/item_layouts/GridItem.vue';
import ListItem from 'components/directory_view/item_layouts/ListItem.vue';
import RowItem from 'components/directory_view/item_layouts/RowItem.vue';
import { ViewType } from 'enums/view_type.ts';
import { useRouterStore } from 'stores/router.ts';

import type { Entry } from 'types/entry.d.ts';

type LayoutMode = 'list' | 'row';

const { entries } = defineProps<{
  entries: Entry[];
}>();

const $store = useRouterStore();

// Configuration
const ITEM_HEIGHT_LIST = 56; // List item height in pixels
const ITEM_HEIGHT_ROW = 48; // Row item height in pixels
const GRID_ITEM_HEIGHT = 220; // Grid item height (including title)
const GRID_ITEM_WIDTH = 150; // Grid item width (approximate)
const BUFFER_SIZE = 5; // Number of items to render outside viewport

// Refs and state
const scroll_container_ref = ref<HTMLElement | null>(null);
const scroll_top = ref(0);
const container_height = ref(0);
const container_width = ref(0);
const container_ready = ref(false);

// ResizeObserver to track container width (width only — height is derived from the viewport
// to avoid a feedback loop where changing offset_bottom changes the section's content height,
// which fires the observer, which changes rows_in_viewport, which changes offset_bottom, etc.)
const resize_observer = ref<ResizeObserver | null>(null);

const view = computed<ViewType>(() => $store.view);

const mode = computed<LayoutMode>(() =>
  get(view) === ViewType.ROWS ? 'row' : 'list');

const layout_mapping = computed(() => ({
  list: ListItem,
  row: RowItem,
}));

// Compute item height based on view type
const item_height = computed<number>(() => {
  switch (get(view)) {
    case ViewType.ROWS:
      return ITEM_HEIGHT_ROW;
    case ViewType.GRID:
      return GRID_ITEM_HEIGHT;
    // LIST
    default:
      return ITEM_HEIGHT_LIST;
  }
});

// For grid view: calculate items per row based on container width
const items_per_row = computed<number>(() => {
  if (get(view) !== ViewType.GRID || get(container_width) === 0) {
    return 1;
  }

  // Account for gap (16px = 1rem) and padding
  const usable_width = get(container_width) - 32;
  const item_slot = GRID_ITEM_WIDTH + 16; // item width + gap
  return Math.max(1, Math.floor(usable_width / item_slot));
});

const rows_in_viewport = computed<number>(() => {
  // Return a minimal value if container isn't ready yet to avoid invalid calculations
  if (get(container_height) === 0 || !get(container_ready)) return 1;
  return Math.ceil(get(container_height) / get(item_height)) + BUFFER_SIZE * 2;
});

// Calculate visible range
const visible_start = computed<number>(() => {
  if (get(view) === ViewType.GRID) {
    const current_row = Math.floor(get(scroll_top) / get(item_height));
    const start_row = Math.max(0, current_row - BUFFER_SIZE);
    return start_row * get(items_per_row);
  }
  const buffer = Math.floor((get(item_height) * BUFFER_SIZE) / get(item_height));
  return Math.max(0, Math.floor(get(scroll_top) / get(item_height)) - buffer);
});

const visible_end = computed<number>(() => {
  const start = get(visible_start);
  if (get(view) === ViewType.GRID) {
    const items_needed = Math.max(1, get(rows_in_viewport) * Math.max(1, get(items_per_row)));
    return Math.min(entries.length, start + items_needed);
  }
  return Math.min(entries.length, start + Math.max(1, get(rows_in_viewport)));
});

const visible_entries = computed<Entry[]>(() => entries.slice(get(visible_start), get(visible_end)));

const offset_top = computed<number>(() => {
  if (get(view) === ViewType.GRID) return 0; // Grid doesn't use offset spacers
  return get(visible_start) * get(item_height);
});

const offset_bottom = computed<number>(() => {
  if (get(view) === ViewType.GRID) return 0;
  // Don't calculate if container isn't ready - prevents flickering on initial load
  if (!get(container_ready)) {
    return Math.max(0, entries.length * get(item_height) - (get(container_height) || window.innerHeight));
  }
  const end = get(visible_end);
  const remaining_items = Math.max(0, entries.length - end);
  return remaining_items * get(item_height);
});

const total_rows = computed<number>(() => {
  if (get(view) === ViewType.GRID) {
    return Math.ceil(entries.length / get(items_per_row));
  }
  return entries.length;
});

const total_scroll_height = computed<number>(() => {
  if (get(view) === ViewType.GRID) {
    return get(total_rows) * get(item_height);
  }
  return entries.length * get(item_height);
});

const rendered_height = computed<number>(() => {
  if (get(view) === ViewType.GRID) {
    const rendered_rows = Math.ceil((get(visible_end) - get(visible_start)) / get(items_per_row));
    return rendered_rows * get(item_height);
  }
  return (get(visible_end) - get(visible_start)) * get(item_height);
});

// Event handlers
function handleScroll(event: Event): void {
  const target = event.target as HTMLElement;
  set(scroll_top, target.scrollTop);
}

function updateContainerHeight(): void {
  // The <section> has no fixed height — it grows with its content. Scrolling is
  // handled by the <main> ancestor. Read the viewport height from visualViewport
  // so this value is completely decoupled from virtual content changes and cannot
  // participate in a ResizeObserver feedback loop.
  set(container_height, window.visualViewport?.height ?? window.innerHeight);
  if (get(container_height) > 0 && get(container_width) > 0) {
    set(container_ready, true);
  }
}

function updateContainerWidth(): void {
  const ele = get(scroll_container_ref);
  if (!ele) return;
  set(container_width, ele.clientWidth);
  if (get(container_height) > 0 && get(container_width) > 0) {
    set(container_ready, true);
  }
}

// Expose methods for external scroll control
defineExpose({
  getScrollPosition: () => get(scroll_top),
  scrollToIndex: (index: number) => {
    const scroller = get(scroll_container_ref)?.parentElement;
    if (!scroller) return;
    if (get(view) === ViewType.GRID) {
      const row = Math.floor(index / get(items_per_row));
      scroller.scrollTop = row * get(item_height);
    } else {
      scroller.scrollTop = index * get(item_height);
    }
  },
  scrollToPosition: (scrollTop: number) => {
    const scroller = get(scroll_container_ref)?.parentElement;
    if (!scroller) return;
    scroller.scrollTop = scrollTop;
  },
});

// Watch for layout changes
watch(
  () => get(view),
  () => {
    // Reset scroll on layout change
    const scroller = get(scroll_container_ref)?.parentElement;
    if (scroller) {
      scroller.scrollTop = 0;
    }
  },
);

// Setup ResizeObserver and viewport listeners
onMounted(() => {
  updateContainerHeight();
  updateContainerWidth();

  // Track width via ResizeObserver on the section itself — safe because width
  // changes don't feed back into offset_bottom.
  set(resize_observer, new ResizeObserver(() => {
    updateContainerWidth();
  }));

  const ele = get(scroll_container_ref);
  if (ele) {
    get(resize_observer)!.observe(ele);

    // <main> is the true scroll container (overflow-y-auto, fixed height).
    // Attach scroll listener there so scroll_top tracks actual scroll position.
    ele.parentElement?.addEventListener('scroll', handleScroll);
  }

  // Track height via visualViewport/window — completely decoupled from content.
  window.visualViewport?.addEventListener('resize', updateContainerHeight);
  window.addEventListener('resize', updateContainerHeight);
});

// Cleanup ResizeObserver and viewport listeners on unmount
onBeforeUnmount(() => {
  get(resize_observer)?.disconnect();
  window.visualViewport?.removeEventListener('resize', updateContainerHeight);
  window.removeEventListener('resize', updateContainerHeight);

  const ele = get(scroll_container_ref);
  ele?.parentElement?.removeEventListener('scroll', handleScroll);
});
</script>

<style scoped>
@reference '../../assets/styles/index.css';

.virtualized-content {
  @apply flex flex-col justify-start items-center w-full;

  .virtual-grid-container {
    @apply w-full flex flex-row flex-wrap justify-start items-stretch gap-4 px-4;

    & :deep(.entry) {
      @apply grow-0 shrink h-auto
        xl:flex-[calc(calc(calc(100%/6)-1rem)+calc(1rem/6))] xl:max-w-[calc(calc(calc(100%/6)-1rem)+calc(1rem/6))]
        lg:flex-[calc(calc(20%-1rem)+0.2rem)] lg:max-w-[calc(calc(20%-1rem)+0.2rem)]
        md:flex-[calc(calc(25%-1rem)+0.25rem)] md:max-w-[calc(calc(25%-1rem)+0.25rem)]
        sm:flex-[calc(calc(calc(100%/3)-1rem)+calc(1rem/3))] sm:max-w-[calc(calc(calc(100%/3)-1rem)+calc(1rem/3))]
        flex-[calc(calc(50%-1rem)+0.5rem)] max-w-[calc(calc(50%-1rem)+0.5rem)] min-h-[200px];

      & .entry-title {
        @apply text-sm py-1 px-2;
      }

      & .entry-meta {
        @apply border-b-0 shrink grow-0;
      }

      & .entry-meta__last-modified {
        @apply border-l-0;
      }

      & .entry-meta__duration {
        @apply border-r-0;
      }
    }
  }

  .entries--list,
  .entries--row {
    @apply flex w-full flex-col;
  }

  .virtual-spacer-top,
  .virtual-spacer-bottom {
    @apply shrink-0 w-full;
  }
}
</style>
