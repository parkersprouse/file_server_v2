import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick } from 'vue';

import { useFakeFullscreen } from 'composables/fake_fullscreen.ts';

import type { FakeFullscreen, FakeFullscreenOptions } from 'composables/fake_fullscreen.ts';
import type { EffectScope } from 'vue';

function pressEscape(): KeyboardEvent {
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key: 'Escape',
  });
  document.body.dispatchEvent(event);
  return event;
}

describe('useFakeFullscreen', () => {
  let scope: EffectScope;
  let push_state: ReturnType<typeof vi.spyOn>;
  let back: ReturnType<typeof vi.spyOn>;
  let request_fullscreen: ReturnType<typeof vi.fn>;

  function setup(options?: FakeFullscreenOptions): FakeFullscreen {
    return scope.run(() => useFakeFullscreen(options))!;
  }

  beforeEach(() => {
    scope = effectScope();
    push_state = vi.spyOn(history, 'pushState');
    back = vi.spyOn(history, 'back').mockImplementation(() => {});
    request_fullscreen = vi.fn();
    Element.prototype.requestFullscreen = request_fullscreen as unknown as Element['requestFullscreen'];
    document.documentElement.style.overflow = '';
  });

  afterEach(() => {
    scope.stop();
    vi.restoreAllMocks();
  });

  it('enters: locks scroll and pushes one history entry carrying the current state', () => {
    history.replaceState({ position: 3 }, '');
    const fs = setup();
    fs.enter();
    fs.enter();

    expect(fs.active.value).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');
    expect(push_state).toHaveBeenCalledTimes(1);
    expect(push_state).toHaveBeenCalledWith({ position: 3 }, '');
  });

  it('exits: restores scroll and removes its history entry', () => {
    document.documentElement.style.overflow = 'clip';
    const fs = setup();
    fs.enter();
    fs.exit();
    fs.exit();

    expect(fs.active.value).toBe(false);
    expect(document.documentElement.style.overflow).toBe('clip');
    expect(back).toHaveBeenCalledTimes(1);
  });

  it('exit(false) leaves the history entry alone', () => {
    const fs = setup();
    fs.enter();
    fs.exit(false);

    expect(fs.active.value).toBe(false);
    expect(back).not.toHaveBeenCalled();
  });

  it('Esc exits and is not passed on to other handlers', () => {
    const outer = vi.fn();
    globalThis.addEventListener('keydown', outer);
    const fs = setup();
    fs.enter();
    pressEscape();

    expect(fs.active.value).toBe(false);
    expect(back).toHaveBeenCalledTimes(1);
    expect(outer).not.toHaveBeenCalled();

    // Once inactive, Esc is nobody's business here any more.
    pressEscape();
    expect(outer).toHaveBeenCalledTimes(1);
    globalThis.removeEventListener('keydown', outer);
  });

  it('Esc is left alone while the host says something else owns it', () => {
    let can_escape = false;
    const fs = setup({ canEscape: () => can_escape });
    fs.enter();
    pressEscape();
    expect(fs.active.value).toBe(true);

    can_escape = true;
    pressEscape();
    expect(fs.active.value).toBe(false);
  });

  it('popstate (back gesture) exits without going back a second time', () => {
    const on_exit = vi.fn();
    const fs = setup({ onExit: on_exit });
    fs.enter();
    globalThis.dispatchEvent(new PopStateEvent('popstate'));

    expect(fs.active.value).toBe(false);
    expect(back).not.toHaveBeenCalled();
    expect(on_exit).toHaveBeenCalledTimes(1);
  });

  it('unmount exits without touching history, and drops its listeners', () => {
    const fs = setup();
    fs.enter();
    scope.stop();

    expect(fs.active.value).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
    expect(back).not.toHaveBeenCalled();

    globalThis.dispatchEvent(new PopStateEvent('popstate'));
    pressEscape();
    expect(back).not.toHaveBeenCalled();
  });

  it('moves focus into the viewer and back to the trigger', async () => {
    const trigger = document.createElement('button');
    const viewer = document.createElement('div');
    viewer.tabIndex = -1;
    document.body.append(trigger, viewer);
    trigger.focus();

    const fs = setup();
    fs.toggle(viewer);
    await nextTick();
    expect(document.activeElement).toBe(viewer);

    fs.toggle();
    await nextTick();
    expect(document.activeElement).toBe(trigger);
    trigger.remove();
    viewer.remove();
  });

  it('never calls the Fullscreen API', () => {
    const fs = setup();
    fs.enter();
    pressEscape();
    fs.toggle();
    globalThis.dispatchEvent(new PopStateEvent('popstate'));

    expect(request_fullscreen).not.toHaveBeenCalled();
  });
});
