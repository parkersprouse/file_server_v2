import 'assets/styles/index.css';

import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from '@/App.vue';
import router from '@/router/index.ts';

// https://vitejs.dev/guide/build.html#load-error-handling
window.addEventListener('vite:preloadError', () => {
  console.error('Vite Preload Error');
  // window.location.reload();
});

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');
