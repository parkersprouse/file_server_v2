import '../styles/audio/neutral.css';
import './skin.css';
import '@videojs/html/ui/container';
import '@videojs/html/ui/error-dialog';
import '@videojs/html/ui/dialog-backdrop';
import '@videojs/html/ui/dialog-popup';
import '@videojs/html/ui/dialog-title';
import '@videojs/html/ui/dialog-description';
import '@videojs/html/ui/dialog-close';
import '@videojs/html/ui/controls';
import '@videojs/html/ui/controls-content';
import '@videojs/html/ui/tooltip-group';
import '@videojs/html/ui/controls-group';
import '@videojs/html/ui/buffering-indicator';
import '@videojs/html/ui/play-button';
import '@videojs/html/ui/tooltip';
import '@videojs/html/ui/tooltip-label';
import '@videojs/html/ui/tooltip-shortcut';
import '@videojs/html/ui/seek-button';
import '@videojs/html/ui/time-group';
import '@videojs/html/ui/time';
import '@videojs/html/ui/time-separator';
import '@videojs/html/ui/time-slider';
import '@videojs/html/ui/slider-track';
import '@videojs/html/ui/slider-buffer';
import '@videojs/html/ui/slider-fill';
import '@videojs/html/ui/slider-thumb';
import '@videojs/html/ui/slider-preview';
import '@videojs/html/ui/slider-value';
import '@videojs/html/ui/mute-button';
import '@videojs/html/ui/volume-popover';
import '@videojs/html/ui/volume-slider';
import '@videojs/html/ui/playback-rate-button';
import '@videojs/html/ui/menu';
import '@videojs/html/ui/menu-content';
import '@videojs/html/ui/playback-rate-radio-group';
import '@videojs/html/ui/menu-radio-item';
import '@videojs/html/ui/menu-item-indicator';
import '@videojs/html/ui/hotkey';
import '@videojs/html/ui/status-announcer';
import { registerIcons } from '@videojs/html/icons';
import {
  checkIcon as checkIconNeutral,
  pauseIcon as pauseIconNeutral,
  playIcon as playIconNeutral,
  restartIcon as restartIconNeutral,
  seekIcon as seekIconNeutral,
  spinnerIcon as spinnerIconNeutral,
  volumeHighIcon as volumeHighIconNeutral,
  volumeLowIcon as volumeLowIconNeutral,
  volumeOffIcon as volumeOffIconNeutral,
} from '@videojs/html/icons/neutral';

registerIcons('neutral', {
  check: checkIconNeutral,
  pause: pauseIconNeutral,
  play: playIconNeutral,
  restart: restartIconNeutral,
  seek: seekIconNeutral,
  spinner: spinnerIconNeutral,
  'volume-high': volumeHighIconNeutral,
  'volume-low': volumeLowIconNeutral,
  'volume-off': volumeOffIconNeutral,
});
