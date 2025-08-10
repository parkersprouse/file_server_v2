import { useEventBus } from '@vueuse/core';
import { createRouter, createWebHistory } from 'vue-router';

import { EventBus } from 'enums/event_bus.ts';
import { Events } from 'enums/events.ts';
import DirectoryView from 'views/DirectoryView.vue';

const $entries_bus = useEventBus(EventBus.Entries);

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      component: DirectoryView,
      name: 'entry',
      path: '/:pathMatch(.*)*',
    },
  ],
  scrollBehavior(_to, _from, saved_position) {
    if (saved_position) return saved_position;
    return { top: 0 };
  },
});

router.afterEach(() => {
  $entries_bus.emit(Events.PathUpdated);
});

export default router;
