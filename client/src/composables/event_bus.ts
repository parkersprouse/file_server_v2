import Emittery from 'emittery';

import type { AppEvent } from 'types/app_event.d.ts';

const emittery = new Emittery<AppEvent>();

/**
 * @example
 *   import { useEventBus } from 'composables/event_bus.ts';
 *   ...
 *   const $event_bus = useEventBus();
 *   ...
 *   const unsub = $event_bus.on(<event: AppEvent>, () => { console.log('respond'); });
 *   ...
 *   unsub();
 */
export function useEventBus(): Emittery<AppEvent> {
  return emittery;
}
