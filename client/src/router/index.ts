import { createRouter, createWebHistory } from 'vue-router';

import DirectoryView from 'views/DirectoryView.vue';

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

export default router;
