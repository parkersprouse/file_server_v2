import { createRouter, createWebHistory } from 'vue-router';

import DirectoryView from 'views/DirectoryView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      beforeEnter(to, _from, next): void {
        if (to.path.includes('%5C')) {
          to.path.replace('%5C', '/');
        }
        next(to);
      },
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
