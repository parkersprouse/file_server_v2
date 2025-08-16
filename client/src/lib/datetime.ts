import dayjs from 'dayjs';
import advanced_formats from 'dayjs/plugin/advancedFormat';
import relativity from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';

import type { Dayjs } from 'dayjs';

dayjs.extend(advanced_formats);
dayjs.extend(relativity);
dayjs.extend(timezone);

function absolute(iso: string | Dayjs): string {
  return dayjs(iso).format('dddd, MMMM D YYYY [at] h:mm A z');
}

function relative(iso: string | Dayjs): string {
  return dayjs(iso).fromNow(true);
}

export {
  absolute,
  dayjs as datetime,
  relative,
};
