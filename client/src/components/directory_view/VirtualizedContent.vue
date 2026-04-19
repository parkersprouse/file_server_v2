<template>
  <section
    ref='scroll_container_ref'
    class='container virtualized-content'
    :class='{
      "px-0! mx-0! w-full! max-w-none!": view === ViewType.LIST,
    }'
    @scroll='handleScroll'
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
import { computed, onMounted, ref, watch } from 'vue';

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

// ResizeObserver to track container size
const resize_observer = ref<ResizeObserver | null>(null);

const view = computed<ViewType>(() => $store.view);

const mode = computed<LayoutMode>(() =>
  view.value === ViewType.ROWS ? 'row' : 'list');

const layout_mapping = computed(() => ({
  list: ListItem,
  row: RowItem,
}));

// Compute item height based on view type
const item_height = computed<number>(() => {
  switch (view.value) {
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
  if (view.value !== ViewType.GRID || container_width.value === 0) {
    return 1;
  }

  // Account for gap (16px = 1rem) and padding
  const usable_width = container_width.value - 32;
  const item_slot = GRID_ITEM_WIDTH + 16; // item width + gap
  return Math.max(1, Math.floor(usable_width / item_slot));
});

const rows_in_viewport = computed<number>(() => {
  if (container_height.value === 0) return 1;
  return Math.ceil(container_height.value / item_height.value) + BUFFER_SIZE * 2;
});

// Calculate visible range
const visible_start = computed<number>(() => {
  if (view.value === ViewType.GRID) {
    const current_row = Math.floor(scroll_top.value / item_height.value);
    const start_row = Math.max(0, current_row - BUFFER_SIZE);
    return start_row * items_per_row.value;
  }
  const buffer = Math.floor((item_height.value * BUFFER_SIZE) / item_height.value);
  return Math.max(0, Math.floor(scroll_top.value / item_height.value) - buffer);
});

const visible_end = computed<number>(() => {
  const start = visible_start.value;
  if (view.value === ViewType.GRID) {
    const items_needed = rows_in_viewport.value * items_per_row.value;
    return Math.min(entries.length, start + items_needed);
  }
  return Math.min(entries.length, start + rows_in_viewport.value);
});

const visible_entries = computed<Entry[]>(() => entries.slice(visible_start.value, visible_end.value));

const offset_top = computed<number>(() => {
  if (view.value === ViewType.GRID) return 0; // Grid doesn't use offset spacers
  return visible_start.value * item_height.value;
});

const offset_bottom = computed<number>(() => {
  if (view.value === ViewType.GRID) return 0;
  const end = visible_end.value;
  return (entries.length - end) * item_height.value;
});

const total_rows = computed<number>(() => {
  if (view.value === ViewType.GRID) {
    return Math.ceil(entries.length / items_per_row.value);
  }
  return entries.length;
});

const total_scroll_height = computed<number>(() => {
  if (view.value === ViewType.GRID) {
    return total_rows.value * item_height.value;
  }
  return entries.length * item_height.value;
});

const rendered_height = computed<number>(() => {
  if (view.value === ViewType.GRID) {
    const rendered_rows = Math.ceil((visible_end.value - visible_start.value) / items_per_row.value);
    return rendered_rows * item_height.value;
  }
  return (visible_end.value - visible_start.value) * item_height.value;
});

// Event handlers
function handleScroll(event: Event): void {
  const target = event.target as HTMLElement;
  scroll_top.value = target.scrollTop;
}

function updateContainerSize(): void {
  if (!scroll_container_ref.value) return;
  container_height.value = scroll_container_ref.value.clientHeight;
  container_width.value = scroll_container_ref.value.clientWidth;
}

// Expose methods for external scroll control
defineExpose({
  getScrollPosition: () => scroll_top.value,
  scrollToIndex: (index: number) => {
    if (!scroll_container_ref.value) return;
    if (view.value === ViewType.GRID) {
      const row = Math.floor(index / items_per_row.value);
      scroll_container_ref.value.scrollTop = row * item_height.value;
    } else {
      scroll_container_ref.value.scrollTop = index * item_height.value;
    }
  },
  scrollToPosition: (scrollTop: number) => {
    if (!scroll_container_ref.value) return;
    scroll_container_ref.value.scrollTop = scrollTop;
  },
});

// Watch for layout changes
watch(
  () => view.value,
  () => {
    // Reset scroll on layout change
    if (scroll_container_ref.value) {
      scroll_container_ref.value.scrollTop = 0;
    }
  },
);

// Setup ResizeObserver
onMounted(() => {
  updateContainerSize();

  resize_observer.value = new ResizeObserver(() => {
    updateContainerSize();
  });

  if (scroll_container_ref.value) {
    resize_observer.value.observe(scroll_container_ref.value);
  }
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
    @apply flex-shrink-0 w-full;
  }
}
</style>
