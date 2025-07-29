import axios from 'axios';

import { config } from '@/config.ts';

export const http = axios.create({
  baseURL: config.server_url,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  responseType: 'json',
});

export default {
  http,
};
