import { createRouter, createWebHistory } from 'vue-router';

import IndexView from '@/views/IndexView.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      component: IndexView,
      name: 'index',
      path: '/:pathMatch(.*)*',
    },
  ],
});

export default router;
