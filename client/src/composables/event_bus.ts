/* eslint-disable @typescript-eslint/no-explicit-any -- n/a */
import { useEventBus as vueUseEventBus } from '@vueuse/core';

import type { EventBusKey, UseEventBusReturn } from '@vueuse/core';

/*
const bus = useEventBus<string>('news')

function listener(event: string) {
  console.log(`news: ${event}`)
}

// listen to an event
const unsubscribe = bus.on(listener)

// fire an event
bus.emit('The Tokyo Olympics has begun')

// unregister the listener
unsubscribe()
// or
bus.off(listener)

// clearing all listeners
bus.reset()
*/

// ------------

/**
 * @example
 *   import { useEventBus } from 'composables/event_bus.ts';
 *   ...
 *   const $event_bus = useEventBus();
 *   ...
 *   const unsub = $event_bus.on('my_event', () => { console.log('respond'); });
 *   ...
 *   unsub();
 */
export function useEventBus<T>(key: EventBusKey<T>): UseEventBusReturn<T, any> {
  return vueUseEventBus(key);
}
/* eslint-enable @typescript-eslint/no-explicit-any */
