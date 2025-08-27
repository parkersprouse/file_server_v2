import { createRouter, createWebHistory } from 'vue-router';

import { useEventBus } from 'composables/event_bus.ts';
import DirectoryView from 'views/DirectoryView.vue';

const $event_bus = useEventBus();

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
    return saved_position ?? {
      left: 0,
      top: 0,
    };
  },
});

router.afterEach(() => {
  $event_bus.emit('path_updated');
});

export default router;
