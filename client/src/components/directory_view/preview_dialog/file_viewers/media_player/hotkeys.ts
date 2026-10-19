/*
 * The keyboard shortcuts both Neutral skins ship (`video/skin.html` /
 * `audio/skin.html` in the Video.js registry), shared so the two players stay
 * in step. Video adds its own fullscreen / picture-in-picture keys; captions'
 * `c` is left out because previews never carry text tracks. `value` is bound
 * as a number — Vue assigns a known custom-element prop as a property.
 */
export interface MediaHotkey {
  action: string;
  keys: string;
  value?: number;
}

export const MEDIA_HOTKEYS: readonly MediaHotkey[] = [
  {
    action: 'togglePaused',
    keys: 'Space',
  },
  {
    action: 'togglePaused',
    keys: 'k',
  },
  {
    action: 'toggleMuted',
    keys: 'm',
  },
  {
    action: 'seekStep',
    keys: 'ArrowRight',
  },
  {
    action: 'seekStep',
    keys: 'ArrowLeft',
  },
  {
    action: 'seekStep',
    keys: 'l',
  },
  {
    action: 'seekStep',
    keys: 'j',
  },
  {
    action: 'volumeStep',
    keys: 'ArrowUp',
  },
  {
    action: 'volumeStep',
    keys: 'ArrowDown',
  },
  {
    action: 'seekToPercent',
    keys: '0-9',
  },
  {
    action: 'seekToPercent',
    keys: 'Home',
    value: 0,
  },
  {
    action: 'seekToPercent',
    keys: 'End',
    value: 100,
  },
  {
    action: 'speedUp',
    keys: '>',
  },
  {
    action: 'speedDown',
    keys: '<',
  },
];

export const VIDEO_HOTKEYS: readonly MediaHotkey[] = [
  ...MEDIA_HOTKEYS,
  {
    action: 'toggleFullscreen',
    keys: 'f',
  },
  {
    action: 'togglePictureInPicture',
    keys: 'i',
  },
];
