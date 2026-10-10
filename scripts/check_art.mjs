// Run with: node scripts/check_art.mjs
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInNewContext } from 'node:vm';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(resolve(root, 'assets/site.js'), 'utf8');
const html = readFileSync(resolve(root, 'art.html'), 'utf8');
const slideCount = [...html.matchAll(/data-slide aria-hidden=/g)].length;
assert.equal(slideCount, 7);
for (const page of readdirSync(root).filter(name => name.endsWith('.html'))) {
  const content = readFileSync(resolve(root, page), 'utf8');
  assert.equal([...content.matchAll(/<h1[ >]/g)].length, 1, page + ': one H1');
  assert.ok(content.includes('href="art.html"'), page + ': Art in navigation');
  assert.deepEqual([...content.matchAll(/<a href="([^"]+)" aria-current="page"/g)].map(match => match[1]), [page]);
  for (const [, url] of content.matchAll(/(?:href|src)="([^"#]+)"/g)) {
    if (!/^(https?:|mailto:)/.test(url)) assert.ok(existsSync(resolve(root, decodeURIComponent(url.split('#')[0]))), page + ': ' + url);
  }
}
function setup({ reduced = false, light = false } = {}) {
  const element = () => ({ listeners: {}, attributes: {}, hidden: true,
    addEventListener(name, callback) { this.listeners[name] = callback; },
    setAttribute(name, value) { this.attributes[name] = value; },
    toggleAttribute(name, enabled) { this.attributes[name] = enabled; },
  });
  const slides = Array.from({ length: slideCount }, () => ({ ...element(), classList: {
    toggle(name, active) { this.active = active; },
  } }));
  const previous = element(), next = element(), rotation = element(), count = element(), playback = element();
  const carousel = { ...element(), dataset: { interval: '3000' },
    querySelectorAll(selector) { return selector === '[data-slide]' ? slides : [previous, next, rotation, playback]; },
    querySelector(selector) { return { '[data-rotation]': rotation, '[data-slide-count]': count,
      '[data-previous]': previous, '[data-next]': next }[selector]; },
  };
  const theme = { ...element(), querySelector: () => element() };
  const iframe = element();
  const motion = { ...element(), matches: reduced };
  const document = { ...element(), hidden: false,
    documentElement: { classList: { add() {} }, dataset: {} }, getElementById: () => null, querySelectorAll: () => [],
    querySelector(selector) { return { '[data-carousel]': carousel, '[data-theme-toggle]': theme, '[data-itch-embed]': iframe }[selector] || null; },
  };
  let tick;
  runInNewContext(source, { document, window: { matchMedia: () => motion }, URLSearchParams,
    localStorage: { getItem: () => light ? 'light' : 'dark', setItem() {} },
    setInterval(callback, interval) { assert.equal(interval, 3000); tick = callback; },
  });
  const active = () => slides.map((slide, index) => slide.attributes['aria-hidden'] === 'false' ? index : -1).filter(index => index >= 0);
  return { active, tick, carousel, previous, next, rotation, count, motion, document, theme, iframe };
}
const test = setup();
assert.deepEqual(test.active(), [0]);
assert.equal(test.count.textContent, '1 / 7');
test.tick(); assert.deepEqual(test.active(), [1]);
for (let i = 1; i < slideCount; i++) test.tick();
assert.deepEqual(test.active(), [0]);
test.previous.listeners.click(); assert.deepEqual(test.active(), [6]);
test.next.listeners.click(); assert.deepEqual(test.active(), [0]);
test.rotation.listeners.click(); test.tick(); assert.deepEqual(test.active(), [0]);
test.rotation.listeners.click();
test.carousel.listeners.mouseenter(); test.tick(); assert.deepEqual(test.active(), [0]);
test.carousel.listeners.mouseleave();
test.document.hidden = true; test.tick(); assert.deepEqual(test.active(), [0]);
test.document.hidden = false;
let prevented = false;
test.carousel.listeners.keydown({ key: 'ArrowRight', preventDefault() { prevented = true; } });
assert.ok(prevented); assert.deepEqual(test.active(), [1]);
test.carousel.listeners.focusin({ target: test.next });
test.tick(); assert.deepEqual(test.active(), [1]);
test.rotation.listeners.click();
test.motion.matches = true; test.motion.listeners.change();
test.tick(); assert.deepEqual(test.active(), [1]);
const reduced = setup({ reduced: true });
reduced.tick(); assert.deepEqual(reduced.active(), [0]);
reduced.rotation.listeners.click(); reduced.tick(); assert.deepEqual(reduced.active(), [1]);
assert.ok(test.iframe.src.includes('bg_color=222224'));
test.theme.listeners.click(); assert.ok(test.iframe.src.includes('bg_color=f0eeea'));
test.theme.listeners.click(); assert.ok(test.iframe.src.includes('fg_color=f6f5f2'));
assert.ok(setup({ light: true }).iframe.src.includes('link_color=ff9a64'), 'Stored light preference must not override dark startup');
console.log('PASS: art navigation and assets; single-slide rotation every 3 seconds, wraparound, keyboard, pause, reduced motion, and itch themes.');
