/*
 * Registers the Video.js UI elements both preview players compose their
 * controls from. Registration entry points are side-effect-only imports
 * (`customElements.define`), and each player component additionally imports
 * its own preset's player element (`@videojs/html/{video,audio}/player`).
 */
import '@videojs/html/ui/buffering-indicator';
import '@videojs/html/ui/container';
import '@videojs/html/ui/controls';
import '@videojs/html/ui/controls-content';
import '@videojs/html/ui/controls-group';
import '@videojs/html/ui/fullscreen-button';
import '@videojs/html/ui/gesture';
import '@videojs/html/ui/hotkey';
import '@videojs/html/ui/mute-button';
import '@videojs/html/ui/play-button';
import '@videojs/html/ui/poster';
import '@videojs/html/ui/seek-button';
import '@videojs/html/ui/slider-buffer';
import '@videojs/html/ui/slider-fill';
import '@videojs/html/ui/slider-preview';
import '@videojs/html/ui/slider-thumb';
import '@videojs/html/ui/slider-track';
import '@videojs/html/ui/slider-value';
import '@videojs/html/ui/time';
import '@videojs/html/ui/time-group';
import '@videojs/html/ui/time-separator';
import '@videojs/html/ui/time-slider';
import '@videojs/html/ui/tooltip';
import '@videojs/html/ui/tooltip-group';
import '@videojs/html/ui/tooltip-label';
import '@videojs/html/ui/tooltip-shortcut';
import '@videojs/html/ui/volume-slider';

// media-chrome's keyboard seek keys, at the 5s offset this app configured
// (`keyboard{backward,forward}seekoffset='5'`). Video.js takes a signed value
// per `<media-hotkey>` instead of one offset per direction.
export const SEEK_HOTKEYS = [
  {
    keys: 'ArrowLeft',
    value: -5,
  },
  {
    keys: 'j',
    value: -5,
  },
  {
    keys: 'ArrowRight',
    value: 5,
  },
  {
    keys: 'l',
    value: 5,
  },
] as const;
