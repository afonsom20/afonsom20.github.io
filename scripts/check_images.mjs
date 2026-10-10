// Run with: node scripts/check_images.mjs
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const element = () => ({ listeners: {}, attributes: {},
  addEventListener(name, callback) { this.listeners[name] = callback; },
  setAttribute(name, value) { this.attributes[name] = value; },
  removeAttribute(name) { delete this[name]; },
  focus(options) { this.focused = options; },
});
const classes = new Set();
const root = { dataset: {}, classList: { add: name => classes.add(name), remove: name => classes.delete(name) } };
const linked = { ...element(), href: 'https://example.com/scene.png' };
const photo = { ...element(), alt: 'Outreach photo', src: 'outreach.jpg', currentSrc: 'outreach.jpg',
  naturalWidth: 7008, naturalHeight: 4672, dataset: {}, closest: () => null };
const artwork = { ...element(), alt: 'Proxima scene', src: 'preview.jpg',
  naturalWidth: 1600, naturalHeight: 900, dataset: {}, closest: () => linked };
const original = { ...element(), alt: 'Poster', src: 'small.jpg',
  naturalWidth: 1698, naturalHeight: 2400, dataset: { fullImage: 'original.png' }, closest: () => null };
const enlarged = element();
const dialog = { ...element(), open: false,
  querySelector: selector => selector === 'img' ? enlarged : null,
  showModal() { this.open = true; },
  close() { this.open = false; this.listeners.close(); },
};
const document = { documentElement: root, body: { append(node) { assert.equal(node, dialog); } },
  querySelectorAll(selector) { assert.equal(selector, 'main img'); return [photo, artwork, original]; },
  querySelector: () => null, getElementById: () => null, createElement: () => dialog,
};
runInNewContext(readFileSync(new URL('../assets/site.js', import.meta.url), 'utf8'), {
  document, localStorage: { getItem() { throw new Error('Theme must not read stored preferences'); } },
});
assert.equal(root.dataset.theme, 'dark');
for (const control of [photo, linked, original]) {
  assert.equal(control.attributes.role, 'button');
  assert.equal(control.attributes['aria-haspopup'], 'dialog');
  assert.equal(control.tabIndex, 0);
}
let prevented = false;
photo.listeners.click({ preventDefault() { prevented = true; } });
assert.ok(prevented); assert.ok(dialog.open); assert.ok(classes.has('image-viewing'));
assert.equal(enlarged.src, 'outreach.jpg');
assert.equal(enlarged.width, 7008); assert.equal(enlarged.height, 4672);
assert.ok(!dialog.innerHTML.includes('figcaption'));
assert.ok(!dialog.innerHTML.includes('<button'));
assert.equal(enlarged.alt, 'Outreach photo');
dialog.listeners.click();
assert.ok(!dialog.open); assert.ok(!classes.has('image-viewing'));
assert.equal(photo.focused.preventScroll, true);
assert.equal(enlarged.src, undefined);
linked.listeners.keydown({ key: 'Enter', preventDefault() {} });
assert.ok(dialog.open); assert.equal(enlarged.src, linked.href);
dialog.close(); // Native Escape dismissal takes the same close path.
assert.equal(linked.focused.preventScroll, true);
original.listeners.keydown({ key: ' ', preventDefault() {} });
assert.equal(enlarged.src, 'original.png'); assert.equal(enlarged.alt, 'Poster');
dialog.listeners.click(); assert.ok(!dialog.open);
console.log('PASS: dark startup, all picture controls, full-size sources, click and keyboard opening, click/Escape closure, scroll unlock, and focus return.');
