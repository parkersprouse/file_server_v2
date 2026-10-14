/*
 * Browser checks for the Video.js preview players (see HANDOFF.md).
 *
 * Run from any directory that has `playwright` installed (it is NOT a project
 * dependency):
 *
 *   mkdir -p /tmp/vjs-verify && cd /tmp/vjs-verify
 *   npm init -y >/dev/null && npm i playwright@1.56.1
 *   npx playwright install chromium firefox webkit
 *   ENGINE=firefox node <repo>/docs/videojs-migration/verify-players.cjs
 *
 * Env:
 *   ENGINE   chromium | firefox | webkit          (default chromium)
 *   CHANNEL  e.g. `chrome` / `msedge` to drive the installed branded browser,
 *            which (unlike Playwright's Chromium) decodes H.264/AAC
 *   BASE     SPA origin                            (default http://127.0.0.1:5173)
 *   API      server origin                         (default http://127.0.0.1:8100)
 *   HEADED   1 to watch the run
 *   ONLY     comma list of suites: desktopVideo,desktopAudio,mobile,lateMoov
 *   OUT      screenshot dir                        (default ./shots-<engine>)
 *
 * Expects the library from make-test-media.sh to be the server's root dir.
 */
const { createRequire } = require('node:module');
const fs = require('node:fs');
const path = require('node:path');

const pw = createRequire(path.join(process.cwd(), 'noop.js'))('playwright');

const ENGINE = process.env.ENGINE ?? 'chromium';
const CHANNEL = process.env.CHANNEL;
const BASE = process.env.BASE ?? 'http://127.0.0.1:5173';
const API = process.env.API ?? 'http://127.0.0.1:8100';
const OUT = path.resolve(process.env.OUT ?? `shots-${ENGINE}${CHANNEL ? '-' + CHANNEL : ''}`);
const ONLY = process.env.ONLY?.split(',');
fs.mkdirSync(OUT, { recursive: true });

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' – ' + detail : ''}`);
}
function note(name, detail) {
  results.push({ name, ok: true, detail, note: true });
  console.log(`NOTE  ${name} – ${detail}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CONTROLS = 'dialog[open] .preview-media-player__controls-content';
const BAR = 'dialog[open] .preview-media-player__bar';
const opacity = (page) => page.$eval(CONTROLS, (e) => getComputedStyle(e).opacity);

async function openPreview(page, name) {
  await page.goto(`${BASE}/?linked=${encodeURIComponent(name)}`);
  await page.waitForSelector('dialog[open] media-container', { timeout: 15000 });
  await page.waitForFunction(() => {
    const m = document.querySelector('dialog[open] media-container video, dialog[open] media-container audio');
    return m && (m.readyState >= 1 || m.error);
  }, null, { timeout: 15000 });
}

const media = (page) => page.evaluateHandle(() =>
  document.querySelector('dialog[open] media-container video, dialog[open] media-container audio'));

function collectErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

async function desktopVideo(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = collectErrors(page);

  // ---- clip.mp4: H.264/AAC with a poster thumbnail.
  await openPreview(page, 'clip.mp4');
  const mp4 = await page.evaluate(() => {
    const v = document.querySelector('dialog[open] video');
    return { src: v.currentSrc, err: v.error?.code ?? null, rs: v.readyState,
      poster: document.querySelector('dialog[open] media-poster img')?.src,
      posterVisible: document.querySelector('dialog[open] media-poster')?.hasAttribute('data-visible') };
  });
  check('mp4: original media URL kept', mp4.src === `${API}/clip.mp4`, mp4.src);
  check('mp4: poster from entry.thumbnail shown', mp4.poster === `${API}/.thumbnails/clip.png` && mp4.posterVisible, JSON.stringify(mp4));
  check('mp4 (H.264/AAC): loads', mp4.err === null && mp4.rs >= 1,
    `error=${mp4.err} readyState=${mp4.rs}${ENGINE === 'chromium' && !CHANNEL ? ' (Playwright Chromium has no H.264 – rerun with CHANNEL=chrome)' : ''}`);
  if (mp4.err === null) {
    await page.mouse.move(640, 400);
    await page.click(`${BAR} media-play-button`);
    await sleep(1500);
    const st = await (await media(page)).evaluate((e) => ({ paused: e.paused, t: e.currentTime }));
    check('mp4: plays', !st.paused && st.t > 0.5, JSON.stringify(st));
    check('mp4: poster hides after play', !(await page.$eval('dialog[open] media-poster', (e) => e.hasAttribute('data-visible'))));
  }
  await page.screenshot({ path: `${OUT}/desktop-video-mp4.png` });

  // ---- clip2.webm: VP9/Opus, every remaining control.
  await openPreview(page, 'clip2.webm');
  const v = await media(page);
  check('webm: original media URL kept', (await v.evaluate((e) => e.currentSrc)) === `${API}/clip2.webm`);
  check('video starts muted (as before)', await v.evaluate((e) => e.muted));
  check('video preload=metadata kept', (await v.evaluate((e) => e.getAttribute('preload'))) === 'metadata');

  await page.mouse.move(640, 400);
  await page.click(`${BAR} media-play-button`);
  await sleep(1200);
  const playing = await v.evaluate((e) => ({ paused: e.paused, t: e.currentTime }));
  check('play button starts playback', !playing.paused && playing.t > 0.3, JSON.stringify(playing));
  check('play button reflects state', !(await page.$eval(`${BAR} media-play-button`, (e) => e.hasAttribute('data-paused'))));
  check('play/pause icon swaps', await page.$eval(`${BAR} media-play-button .icon-pause`, (e) => getComputedStyle(e).display !== 'none'));

  const timeText = await page.$eval(`${BAR} media-time-group`, (e) => e.textContent.replace(/\s+/g, ''));
  check('time display shows current / duration', /^0:0\d\/0:12$/.test(timeText), timeText);

  await page.click(`${BAR} media-mute-button`);
  check('mute button unmutes', !(await v.evaluate((e) => e.muted)));
  check('video does not write volume prefs', (await page.evaluate(() => localStorage.getItem('media-chrome-pref-muted'))) === null);

  await page.click(`${BAR} button[role=switch]`);
  check('loop button sets native loop', await v.evaluate((e) => e.loop));
  check('loop button aria-checked', (await page.$eval(`${BAR} button[role=switch]`, (e) => e.getAttribute('aria-checked'))) === 'true');
  await page.click(`${BAR} button[role=switch]`);
  check('loop button toggles off', !(await v.evaluate((e) => e.loop)));

  const box = await page.$eval(`${BAR} media-time-slider`, (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.mouse.click(box.x + box.w * 0.75, box.y + box.h / 2);
  await sleep(500);
  const tSeek = await v.evaluate((e) => e.currentTime);
  check('time slider seeks', Math.abs(tSeek - 9) < 1.2, `t=${tSeek.toFixed(2)}`);

  // Mouse click on the picture toggles playback; the container then has focus.
  await page.click('dialog[open] media-container', { position: { x: 250, y: 300 } });
  await sleep(300);
  check('mouse click on video toggles playback', await v.evaluate((e) => e.paused));
  await page.focus('dialog[open] media-container');
  const keySeek = async (key, expected) => {
    const a = await v.evaluate((e) => e.currentTime);
    await page.keyboard.press(key);
    await sleep(300);
    const b = await v.evaluate((e) => e.currentTime);
    check(`${key} seeks ${expected > 0 ? '+' : ''}${expected}s`, Math.abs(b - a - expected) < 0.7, `${a.toFixed(2)} → ${b.toFixed(2)}`);
  };
  await keySeek('ArrowLeft', -5);
  await keySeek('ArrowRight', 5);
  await keySeek('j', -5);
  await keySeek('l', 5);
  check('arrow keys stay with focused player (no gallery nav)', (await v.evaluate((e) => e.currentSrc)).endsWith('clip2.webm'));
  const vol0 = await v.evaluate((e) => e.volume);
  await page.keyboard.press('ArrowDown');
  await sleep(150);
  check('ArrowDown lowers volume', (await v.evaluate((e) => e.volume)) < vol0);
  await page.keyboard.press('ArrowUp');
  await sleep(150);
  const r0 = await v.evaluate((e) => e.playbackRate);
  await page.keyboard.press('>');
  await sleep(150);
  check('> speeds up', (await v.evaluate((e) => e.playbackRate)) > r0);
  await page.keyboard.press('<');
  await sleep(150);
  await page.keyboard.press('k');
  await sleep(250);
  check('k hotkey toggles play', !(await v.evaluate((e) => e.paused)));
  const muted0 = await v.evaluate((e) => e.muted);
  await page.keyboard.press('m');
  await sleep(150);
  check('m hotkey toggles mute', (await v.evaluate((e) => e.muted)) !== muted0);

  // Autohide: 2s idle hides while playing AND while paused (kept from media-chrome).
  await page.mouse.move(600, 380);
  await sleep(300);
  const shown = await opacity(page);
  await page.evaluate(() => document.activeElement?.blur());
  await page.mouse.move(610, 390);
  await sleep(3500);
  check('controls visible on activity', shown === '1', `opacity=${shown}`);
  check('controls hide after 2s idle (playing)', (await opacity(page)) === '0');
  check('cursor hidden while idle', await page.$eval('dialog[open] media-container', (e) => getComputedStyle(e).cursor === 'none'));
  await page.mouse.move(640, 420);
  await sleep(200);
  await page.click(`${BAR} media-play-button`); // pause
  await page.evaluate(() => document.activeElement?.blur());
  await page.mouse.move(645, 300);
  await sleep(3500);
  check('controls hide after 2s idle (paused, as before)', (await opacity(page)) === '0');
  await page.mouse.move(500, 300);
  await sleep(250);
  check('mouse move reveals idle controls', (await opacity(page)) === '1');

  // Keyboard focus keeps controls visible (Tab into the bar).
  await page.focus(`${BAR} media-play-button`);
  await page.keyboard.press('Tab');
  await sleep(3000);
  check('controls stay visible while they hold keyboard focus', (await opacity(page)) === '1');

  // Tooltips: native popovers inside the dialog subtree.
  await page.mouse.move(500, 300);
  await page.hover(`${BAR} media-play-button`);
  await sleep(900);
  const tip = await page.evaluate(() => {
    const t = [...document.querySelectorAll('dialog[open] media-tooltip')].find((e) => e.hasAttribute('data-open'));
    if (!t) return null;
    const r = t.getBoundingClientRect();
    return { text: t.querySelector('media-tooltip-label')?.textContent.trim(), popover: t.matches(':popover-open'), top: r.top, h: r.height };
  });
  check('tooltip shows media button label', !!tip && /^(play|pause)/i.test(tip.text ?? ''), JSON.stringify(tip));
  check('tooltip sits above the bar (positioned, not at UA popover centre)', !!tip && tip.top > 600 && tip.top < 780, JSON.stringify(tip));
  await page.screenshot({ path: `${OUT}/desktop-video-tooltip.png` });

  // Fullscreen targets the container.
  await page.click(`${BAR} media-fullscreen-button`);
  await sleep(800);
  const fsEl = await page.evaluate(() => (document.fullscreenElement ?? document.webkitFullscreenElement)?.localName);
  check('fullscreen button fullscreens media-container', fsEl === 'media-container', String(fsEl));
  await page.screenshot({ path: `${OUT}/desktop-video-fullscreen.png` });
  if (fsEl) {
    await page.keyboard.press('Escape');
    await sleep(800);
    const after = await page.evaluate(() => ({
      fs: !!(document.fullscreenElement ?? document.webkitFullscreenElement),
      dialogOpen: !!document.querySelector('dialog[open]'),
    }));
    note('Esc while fullscreen', `exits fullscreen=${!after.fs}, preview dialog still open=${after.dialogOpen} (compare with media-chrome on the parent commit)`);
    if (after.dialogOpen && !after.fs) {
      await page.focus('dialog[open] media-container');
      await page.keyboard.press('f');
      await sleep(800);
      check('f hotkey enters fullscreen', !!(await page.evaluate(() => document.fullscreenElement ?? document.webkitFullscreenElement)));
      await page.keyboard.press('f');
      await sleep(800);
      check('f hotkey exits fullscreen', !(await page.evaluate(() => document.fullscreenElement ?? document.webkitFullscreenElement)));
    }
  }

  // Gallery arrow navigation still works when focus is outside the player.
  if (await page.$('dialog[open]')) {
    await page.evaluate(() => document.activeElement?.blur());
    const before = await page.evaluate(() => document.querySelector('dialog[open] video, dialog[open] audio')?.currentSrc);
    await page.keyboard.press('ArrowRight');
    await sleep(1500);
    const after = await page.evaluate(() => document.querySelector('dialog[open] video, dialog[open] audio')?.currentSrc);
    check('gallery ArrowRight navigates when player unfocused', !!after && after !== before, `${before} → ${after}`);
  }

  // h:mm:ss display.
  await openPreview(page, 'long.mp4');
  const longText = await page.$eval(`${BAR} media-time-group`, (e) => e.textContent.replace(/\s+/g, ''));
  check('time display switches to h:mm:ss past an hour', /^0:00:00\/1:01:40$/.test(longText), longText);

  check('no page/console errors (desktop video)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

async function lateMoov(browser) {
  // Firefox regression guard for `preload='metadata'` (see VideoPreview.vue).
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await openPreview(page, 'clip-late-moov.mp4');
  const v = await media(page);
  if (await v.evaluate((e) => e.error)) {
    check('late-moov mp4 loads', false, 'media error (no H.264 in this browser build?)');
    return ctx.close();
  }
  const seekable = await v.evaluate((e) => (e.seekable.length ? e.seekable.end(e.seekable.length - 1) : 0));
  check('late-moov: whole file seekable right after metadata', seekable > 110, `seekable end=${seekable.toFixed(1)}s of 120s`);
  const t0 = Date.now();
  await v.evaluate((e) => { e.currentTime = 100; });
  await page.waitForFunction(() => {
    const e = document.querySelector('dialog[open] video');
    return !e.seeking && e.currentTime > 99;
  }, null, { timeout: 15000 }).catch(() => {});
  const t = await v.evaluate((e) => e.currentTime);
  check('late-moov: seek to 100s lands', t > 99, `t=${t.toFixed(1)} after ${Date.now() - t0}ms`);
  await ctx.close();
}

async function desktopAudio(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  const errors = collectErrors(page);
  await page.goto(BASE);
  await page.evaluate(() => { localStorage.setItem('media-chrome-pref-volume', '0.3'); localStorage.setItem('media-chrome-pref-muted', 'false'); });
  await openPreview(page, 'song.mp3');
  const a = await media(page);
  await sleep(300);
  check('audio: original media URL kept', (await a.evaluate((e) => e.currentSrc)) === `${API}/song.mp3`);
  check('audio: legacy media-chrome volume pref restored', Math.abs((await a.evaluate((e) => e.volume)) - 0.3) < 0.01, String(await a.evaluate((e) => e.volume)));
  await page.click(`${BAR} media-play-button`);
  await sleep(1000);
  check('audio plays', !(await a.evaluate((e) => e.paused)));
  check('audio volume slider visible (desktop)', await page.$eval(`${BAR} media-volume-slider`, (e) => e.getBoundingClientRect().width > 50));
  const vb = await page.$eval(`${BAR} media-volume-slider`, (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await page.mouse.click(vb.x + vb.w * 0.8, vb.y + vb.h / 2);
  await sleep(300);
  const vol = await a.evaluate((e) => e.volume);
  check('volume slider sets volume', Math.abs(vol - 0.8) < 0.08, vol.toFixed(2));
  check('volume pref saved', Math.abs(Number(await page.evaluate(() => localStorage.getItem('media-chrome-pref-volume'))) - vol) < 0.01);
  await page.click(`${BAR} media-mute-button`);
  await sleep(200);
  check('mute pref saved', (await page.evaluate(() => localStorage.getItem('media-chrome-pref-muted'))) === 'true');
  await page.mouse.move(10, 10);
  await sleep(3000);
  check('audio controls never autohide', (await opacity(page)) === '1');
  check('mobile transport row hidden on desktop', await page.$eval('dialog[open] .preview-audio-player__transport', (e) => getComputedStyle(e).display === 'none'));
  await page.screenshot({ path: `${OUT}/desktop-audio.png` });
  await openPreview(page, 'song.mp3');
  const a2 = await media(page);
  await sleep(300);
  check('mute + volume restored on reopen', await a2.evaluate((e) => e.muted) && Math.abs((await a2.evaluate((e) => e.volume)) - vol) < 0.01);
  await openPreview(page, 'song.m4a');
  check('m4a (AAC) loads', !(await (await media(page)).evaluate((e) => e.error)));
  check('no page/console errors (desktop audio)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

async function mobile(browser) {
  const device = { chromium: pw.devices['Pixel 7'], webkit: pw.devices['iPhone 15'] }[ENGINE];
  // Firefox has no mobile emulation in Playwright; touch + small viewport only.
  const ctx = await browser.newContext(device ?? { viewport: { width: 390, height: 844 }, hasTouch: true });
  if (!device) note('mobile', 'Firefox: viewport + hasTouch only (no isMobile emulation) – confirm on a real Android device');
  const page = await ctx.newPage();
  const errors = collectErrors(page);
  await openPreview(page, 'clip2.webm');
  if (await (await media(page)).evaluate((e) => e.error)) await openPreview(page, 'clip.mp4'); // WebKit has no VP9-in-WebM on some builds
  const v = await media(page);
  const c = 'dialog[open] .preview-video-player__centered';
  check('mobile: centred transport shown', await page.$eval(c, (e) => getComputedStyle(e).display !== 'none'));
  check('mobile: two-row bar', !!(await page.$('dialog[open] .preview-video-player__bar--mobile__bottom-bar')));
  await page.tap(`${c} media-play-button`);
  await sleep(1500);
  check('mobile: play via centred button', !(await v.evaluate((e) => e.paused)));
  check('mobile: plays inline (playsinline)', !(await page.evaluate(() => document.fullscreenElement ?? document.webkitFullscreenElement)));
  const cb = await page.$eval('dialog[open] media-container', (e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, h: r.height }; });
  const tapSurface = () => page.touchscreen.tap(cb.x + 8, cb.y + cb.h * 0.3);
  const reveal = async () => {
    if (await page.$eval(CONTROLS, (e) => !e.hasAttribute('data-user-active'))) { await tapSurface(); await sleep(400); }
  };
  await reveal();
  const t0 = await v.evaluate((e) => e.currentTime);
  await page.tap(`${c} media-seek-button[data-direction="forward"]`);
  await sleep(300);
  const t1 = await v.evaluate((e) => e.currentTime);
  check('mobile: +5 seek button', t1 - t0 > 4, `${t0.toFixed(2)} → ${t1.toFixed(2)}`);
  await reveal();
  await page.tap(`${c} media-seek-button[data-direction="backward"]`);
  await sleep(300);
  const t2 = await v.evaluate((e) => e.currentTime);
  check('mobile: -5 seek button', t1 - t2 > 4, `${t1.toFixed(2)} → ${t2.toFixed(2)}`);
  await page.screenshot({ path: `${OUT}/mobile-video.png` });

  await sleep(2500); // let the controls idle out while playing
  await tapSurface();
  await sleep(600);
  const op1 = await opacity(page);
  await tapSurface();
  await sleep(1300);
  const op2 = await opacity(page);
  check('mobile: tap toggles controls (not playback)', op1 === '1' && op2 === '0' && !(await v.evaluate((e) => e.paused)), `${op1} → ${op2}`);

  await reveal();
  await page.tap(`${c} media-play-button`); // pause
  await sleep(3000);
  const pausedIdle = await opacity(page);
  await tapSurface();
  await sleep(500);
  const pausedTap1 = await opacity(page);
  await tapSurface();
  await sleep(1300);
  const pausedTap2 = await opacity(page);
  check('mobile paused: idle hides, tap shows, tap hides', pausedIdle === '0' && pausedTap1 === '1' && pausedTap2 === '0' && await v.evaluate((e) => e.paused),
    `${pausedIdle} → ${pausedTap1} → ${pausedTap2}`);

  // Horizontal swipe over the picture pages the gallery (CDP touch: Chromium only).
  if (ENGINE === 'chromium') {
    const before = await v.evaluate((e) => e.currentSrc);
    const cdp = await ctx.newCDPSession(page);
    const y = cb.y + cb.h * 0.3;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 300, y }] });
    for (const x of [260, 220, 180, 140, 100, 60]) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y }] }); await sleep(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(1500);
    const after = await page.evaluate(() => document.querySelector('dialog[open] video, dialog[open] audio')?.currentSrc);
    check('mobile: swipe on video surface pages gallery', !!after && after !== before, `${before} → ${after}`);
  }

  await openPreview(page, 'song.mp3');
  check('mobile audio: transport row shown', await page.$eval('dialog[open] .preview-audio-player__transport', (e) => getComputedStyle(e).display !== 'none'));
  check('mobile audio: desktop-only controls hidden', await page.$eval(`${BAR} media-volume-slider`, (e) => getComputedStyle(e).display === 'none'));
  await page.tap('dialog[open] .preview-audio-player__transport button[role=switch]');
  check('mobile audio: loop toggles', await (await media(page)).evaluate((e) => e.loop));
  await page.screenshot({ path: `${OUT}/mobile-audio.png` });
  check('no page/console errors (mobile)', errors.length === 0, errors.join(' | '));
  await ctx.close();
}

(async () => {
  const launcher = pw[ENGINE];
  const args = ENGINE === 'chromium' ? ['--autoplay-policy=no-user-gesture-required'] : [];
  const firefoxUserPrefs = ENGINE === 'firefox' ? { 'media.autoplay.default': 0 } : undefined;
  const browser = await launcher.launch({ channel: CHANNEL, headless: !process.env.HEADED, args, firefoxUserPrefs });
  console.log(`${ENGINE}${CHANNEL ? ` (${CHANNEL})` : ''} ${browser.version()} – screenshots in ${OUT}`);
  for (const fn of [desktopVideo, lateMoov, desktopAudio, mobile]) {
    if (ONLY && !ONLY.includes(fn.name)) continue;
    try { await fn(browser); } catch (e) { check(`${fn.name} crashed`, false, e.stack.split('\n').slice(0, 3).join(' ')); }
  }
  await browser.close();
  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  process.exitCode = failed.length ? 1 : 0;
})();
