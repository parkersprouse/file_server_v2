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

// https://prismjs.com/docs/prism#.disableWorkerMessageHandler
//* eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- types are misleading
// window.Prism = window.Prism || {};
// window.Prism.disableWorkerMessageHandler = true;
// window.Prism.manual = true;

document.addEventListener('DOMContentLoaded', async () => {
  await import('@/vendor/prism/prism.min.js');
});

const pinia = createPinia();
const app = createApp(App);

app.use(pinia);
app.use(router);

app.mount('#app');
