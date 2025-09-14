import 'assets/styles/index.css';

import 'media-chrome';
import { createPinia } from 'pinia';
import { createApp } from 'vue';

import App from '@/App.vue';
import router from '@/router/index.ts';

// https://vitejs.dev/guide/build.html#load-error-handling
window.addEventListener('vite:preloadError', () => {
  console.error('Vite Preload Error');
  // window.location.reload();
});

document.addEventListener('DOMContentLoaded', async () => {
  await import('@/vendor/prism/prism.min.js');
});

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

app.mount('#app');
