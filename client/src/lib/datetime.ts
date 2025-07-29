import dayjs from 'dayjs';
import relativity from 'dayjs/plugin/relativeTime';

dayjs.extend(relativity);

export {
  dayjs as datetime,
};
