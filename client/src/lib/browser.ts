import { feature } from 'caniuse-lite';
import { UAParser } from 'ua-parser-js';

import type { PackedFeature } from 'caniuse-lite';

export { features } from 'caniuse-lite';

export const { browser, device, os } = UAParser(navigator.userAgent);

const mobile_aliases: { [key: string]: string; } = {
  chrome: 'chr',
  firefox: 'ff',
  safari: 'saf',
} as const;

export function isMobile(name?: string, platform?: string): boolean {
  const lname = name?.toLowerCase();
  const lplatform = platform?.toLowerCase();

  let mobile = false;
  if (lname) mobile = lname.includes('mobile');
  if (lplatform) mobile = (lname ? mobile : true) && ['android', 'ios'].includes(lplatform);
  return mobile;
}

export function keyify(name?: string, platform?: string): string | undefined {
  const lname = name?.toLowerCase();
  const lplatform = platform?.toLowerCase();

  let key = lname?.replace(/mobile\s+/g, '');
  if (
    typeof key === 'string' &&
    isMobile(name, platform) &&
    ((lplatform === 'android' && ['chrome', 'firefox'].includes(key)) ||
      (lplatform === 'ios' && key === 'safari'))
  ) {
    key = `${lplatform!.substring(0, 3)}_${mobile_aliases[key]}`;
  }

  return key;
}

export function checkSupport(packed_feature?: PackedFeature): boolean {
  if (!packed_feature) return false;

  const { stats } = feature(packed_feature);
  const details = {
    name: browser.name,
    platform: os.name,
    version: Number(browser.version) || Number(browser.major),
  };

  const key = keyify(details.name, details.platform);
  if (details.version && key && stats[key]) {
    const version_map = stats[key];
    const versions = Object.keys(version_map);

    const matched_version = versions.find((id) => id === `${details.version}`);
    if (matched_version) return version_map[matched_version] === 'y';

    const ranges = versions.filter((id) => id.includes('-'));
    for (const range of ranges) {
      const [lower, higher] = range.split('-');
      if (Number(lower) < details.version && details.version > Number(higher)) {
        return true;
      }
    }
  }

  return false;
}
