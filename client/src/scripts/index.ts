import '@/styles/index.css';

import { icons } from '@iconify-json/ph';
import { addCollection } from 'iconify-icon';

import { init } from '@/scripts/dom.ts';

addCollection(icons);

document.addEventListener('DOMContentLoaded', () => {
  init();
});
