// Run with: node scripts/check_proxima.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../assets/site.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../art.html', import.meta.url), 'utf8');
const photos = [...html.matchAll(/aria-label="View full-size Proxima artwork: ([^"]+)"/g)].map(match => match[1]);
assert.equal(photos.length, 7);
assert.ok(html.includes('data-proxima-rotation hidden'));

function setup(reduced = false) {
  const element = () => ({ listeners: {}, attributes: {},
    addEventListener(name, callback) { this.listeners[name] = callback; },
    setAttribute(name, value) { this.attributes[name] = value; },
  });
  const gallery = { ...element(), scrollLeft: 0, classList: { add() {} } };
  gallery.children = photos.map(name => ({ name,
    getBoundingClientRect() { return { left: gallery.children.indexOf(this) * 120 - gallery.scrollLeft }; },
  }));
  Object.defineProperty(gallery, 'firstElementChild', { get: () => gallery.children[0] });
  gallery.append = photo => { gallery.children.splice(gallery.children.indexOf(photo), 1); gallery.children.push(photo); };
  const button = element();
  const motion = { ...element(), matches: reduced };
  const document = { hidden: false, documentElement: { classList: { add() {} }, dataset: {} },
    getElementById: () => null, querySelectorAll: () => [],
    querySelector: selector => ({ '.proxima-stills': gallery, '[data-proxima-rotation]': button })[selector] || null,
  };
  let frame;
  runInNewContext(source, { document, window: { matchMedia: () => motion }, requestAnimationFrame(callback) { frame = callback; } });
  return { gallery, button, motion, document, tick: time => frame(time) };
}

const test = setup();
const originals = [...test.gallery.children];
assert.equal(test.button.hidden, false);
assert.equal(test.button.textContent, 'Pause');
test.tick(0);
// High-refresh displays must accumulate fractional movement instead of stalling.
for (let time = 10; time <= 1000; time += 10) test.tick(time);
assert.equal(test.gallery.scrollLeft, 20);
for (let time = 1100; time <= 6000; time += 100) test.tick(time);
assert.equal(test.gallery.scrollLeft, 0);
assert.equal(test.gallery.children[0], originals[1]);
for (let time = 6100; time <= 42000; time += 100) test.tick(time);
assert.deepEqual(test.gallery.children, originals, 'All original image controls survive a full loop');
assert.equal(test.gallery.scrollLeft, 0);

const assertPaused = time => { const position = test.gallery.scrollLeft; test.tick(time); assert.equal(test.gallery.scrollLeft, position); };
test.gallery.listeners.mouseenter(); assertPaused(42100);
test.gallery.listeners.mouseleave(); test.tick(42200); assert.equal(test.gallery.scrollLeft, 2);
test.gallery.listeners.focusin(); assertPaused(42300); assert.equal(test.button.textContent, 'Play');
test.button.listeners.click(); test.tick(42400); assert.equal(test.gallery.scrollLeft, 4);
test.gallery.listeners.pointerdown(); assertPaused(42500);
test.button.listeners.click();
test.document.hidden = true; assertPaused(42600);
test.document.hidden = false;
test.tick(100000); assert.equal(test.gallery.scrollLeft, 6, 'Returning to a tab must not jump');
test.motion.matches = true; test.motion.listeners.change(); assertPaused(100100);

const reduced = setup(true);
assert.equal(reduced.button.textContent, 'Play');
reduced.tick(0); reduced.tick(100); assert.equal(reduced.gallery.scrollLeft, 0);
reduced.button.listeners.click(); reduced.tick(200); assert.equal(reduced.gallery.scrollLeft, 2);
console.log('PASS: slow Proxima scrolling, seamless looping, original image controls, hover/focus/touch/playback pauses, background tabs, and reduced motion.');
