// Run with: node scripts/check_gallery.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../assets/site.js', import.meta.url), 'utf8');
for (const { page, selector, count, name } of [
  { page: 'outreach.html', selector: '[data-outreach-gallery]', count: 11, name: 'outreach photo' },
  { page: 'art.html', selector: '[data-proxima-gallery]', count: 7, name: 'Proxima artwork' },
]) {
  const html = readFileSync(new URL('../' + page, import.meta.url), 'utf8');
  const trackHtml = html.match(/<div[^>]*data-gallery-track[^>]*>([\s\S]*?)<\/div>/)?.[1];
  assert.ok(trackHtml, 'Gallery track not found');
  const photos = [...trackHtml.matchAll(/src="(assets\/[^" ]+)"/g)].map(match => match[1]);
  assert.equal(photos.length, count);
  assert.equal(new Set(photos).size, count);
  if (page === 'art.html') {
    assert.equal([...trackHtml.matchAll(/<a href="assets\/art\/Proxima\//g)].length, count);
    assert.ok(!trackHtml.includes('figcaption'));
    assert.ok(html.includes('data-gallery-name="Proxima artwork"'));
  }

  function setup(reduced = false, random = () => .999) {
    const element = () => ({
      listeners: {}, attributes: {}, style: {},
      addEventListener(name, callback) { this.listeners[name] = callback; },
      setAttribute(name, value) { this.attributes[name] = value; },
    });
    const track = element();
    track.children = photos.map(src => ({ ...element(), src,
      getBoundingClientRect() { return { left: track.children.indexOf(this) * 120 }; },
    }));
    Object.defineProperty(track, 'firstElementChild', { get: () => track.children[0] });
    Object.defineProperty(track, 'lastElementChild', { get: () => track.children.at(-1) });
    track.append = photo => { track.children.splice(track.children.indexOf(photo), 1); track.children.push(photo); };
    track.prepend = photo => { track.children.splice(track.children.indexOf(photo), 1); track.children.unshift(photo); };
    track.getBoundingClientRect = () => ({ left: 0 });
    const button = element();
    const previous = element();
    const next = element();
    const gallery = element();
    gallery.dataset = { galleryName: name };
    gallery.querySelector = selector => ({
      '[data-gallery-track]': track, '[data-gallery-rotation]': button,
      '[data-gallery-previous]': previous, '[data-gallery-next]': next,
    })[selector];
    const motion = { ...element(), matches: reduced };
    const document = { ...element(), hidden: false,
      documentElement: { classList: { add() {} }, dataset: {} },
      getElementById: () => null, querySelectorAll: () => [],
      querySelector: query => query === selector ? gallery : null,
    };
    let tick;
    runInNewContext(source, { document, window: { matchMedia: () => motion },
      Math: Object.assign(Object.create(Math), { random }),
      setInterval(callback, interval) { assert.equal(interval, 3000); tick = callback; },
    });
    const complete = () => track.listeners.transitionend({ target: track, propertyName: 'transform' });
    const visible = () => track.children.filter(photo => photo.attributes['aria-hidden'] === 'false').map(photo => photo.src);
    return { track, button, previous, next, gallery, motion, document, tick, complete, visible };
  }

  const test = setup();
  assert.equal(test.button.attributes['aria-label'], `Pause automatic ${name} changes`);
  assert.deepEqual(test.visible(), photos.slice(0, 3));
  assert.deepEqual(test.track.children.map(photo => photo.tabIndex), photos.map((_, index) => index < 3 ? 0 : -1));
  test.tick();
  assert.equal(test.track.style.transform, 'translateX(-120px)');
  test.tick(); // A second tick must not skip a photo during an unfinished transition.
  test.complete();
  assert.deepEqual(test.visible(), photos.slice(1, 4));
  for (let i = 1; i < photos.length; i++) { test.tick(); test.complete(); }
  assert.deepEqual(test.visible(), photos.slice(0, 3));
  assert.equal(test.track.style.transform, '');

  const assertPaused = () => { test.tick(); assert.equal(test.track.style.transform, ''); };
  test.gallery.listeners.focusin({ target: test.button });
  test.button.listeners.click();
  assert.equal(test.button.textContent, 'Play');
  assertPaused();
  test.button.listeners.click();
  test.gallery.listeners.mouseenter();
  assertPaused();
  test.gallery.listeners.mouseleave();
  test.document.hidden = true;
  assertPaused();
  test.document.hidden = false;
  test.gallery.listeners.focusin({ target: test.gallery });
  assertPaused();
  test.button.listeners.click();
  test.tick();
  test.motion.matches = true;
  test.motion.listeners.change(); // Changing motion preference mid-transition resets the strip.
  assert.equal(test.track.style.transform, '');
  assertPaused();

  const reduced = setup(true);
  assert.equal(reduced.button.textContent, 'Play');
  reduced.tick();
  assert.deepEqual(reduced.visible(), photos.slice(0, 3));
  reduced.button.listeners.click();
  reduced.tick(); // Explicit playback works without an animated transition.
  assert.deepEqual(reduced.visible(), photos.slice(1, 4));
  const manual = setup();
  assert.equal(manual.previous.hidden, false);
  assert.equal(manual.next.hidden, false);
  manual.previous.listeners.click(); // Previous wraps from the first photo to the last.
  manual.complete();
  assert.deepEqual(manual.visible(), [photos.at(-1), ...photos.slice(0, 2)]);
  assert.equal(manual.button.textContent, 'Play');
  manual.tick(); // Manual browsing pauses autoplay.
  assert.equal(manual.track.style.transform, '');
  manual.next.listeners.click();
  manual.complete();
  assert.deepEqual(manual.visible(), photos.slice(0, 3));
  for (const key of ['ArrowRight', 'ArrowLeft']) {
    let prevented = false;
    manual.gallery.listeners.keydown({ key, preventDefault() { prevented = true; } });
    assert.equal(prevented, true);
    manual.complete();
  }
  assert.deepEqual(manual.visible(), photos.slice(0, 3));
  const reducedManual = setup(true);
  reducedManual.previous.listeners.click();
  assert.deepEqual(reducedManual.visible(), [photos.at(-1), ...photos.slice(0, 2)]);
  reducedManual.next.listeners.click();
  assert.deepEqual(reducedManual.visible(), photos.slice(0, 3));
  let randomCalls = 0;
  const shuffled = setup(true, () => { randomCalls++; return 0; });
  const shuffledOrder = shuffled.track.children.map(photo => photo.src);
  assert.equal(randomCalls, photos.length - 1);
  assert.notDeepEqual(shuffledOrder, photos);
  assert.deepEqual([...shuffledOrder].sort(), [...photos].sort());
  assert.deepEqual(shuffled.visible(), shuffledOrder.slice(0, 3));
  shuffled.previous.listeners.click();
  assert.deepEqual(shuffled.visible(), [shuffledOrder.at(-1), ...shuffledOrder.slice(0, 2)]);
  shuffled.next.listeners.click();
  assert.deepEqual(shuffled.visible(), shuffledOrder.slice(0, 3));
  console.log(`PASS: ${page}; all images, per-load shuffle, gallery rotation, arrows, keyboard navigation, pause controls, and reduced motion.`);
}
