import axios from 'axios';

import { config } from '@/config.ts';
import { trim } from 'lib/utils.ts';

export const http = axios.create({
  baseURL: trim(`http://${window.location.hostname}:${config.server_port}`),
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  responseType: 'json',
});

export default {
  http,
};
