import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFrame, normalizePreferences, defaults, fitRenderer } from '../layout.js';

test('frame stays horizontally centered and respects top spacing across viewport sizes', () => {
  for (const width of [320, 390, 844, 1280]) for (const height of [0, 90, 220, 400, 800]) {
    for (const percentage of [0, 1, 37, 99, 100]) for (const topSpace of [0, 1, 101, 1000]) {
      const box = calculateFrame(width, height, { topSpace, width: percentage });
      assert.ok(box.width <= width && box.left >= 0);
      assert.equal(box.top, topSpace);
      assert.ok(Math.abs(box.left - (width - box.left - box.width)) < 1e-8);
      assert.ok(box.height >= 0 && box.height <= Math.max(0, height - topSpace) + 1e-8);
      if (percentage === 0) assert.equal(box.height, 0);
    }
  }
});
test('keyboard reduction preserves width and requested top spacing', () => {
  const before = calculateFrame(390, 790, { ...defaults, topSpace: 13 });
  const after = calculateFrame(390, 180, { ...defaults, topSpace: 13 });
  assert.equal(after.width, before.width);
  assert.equal(after.height, 167);
  assert.equal(after.top, 13);
  assert.equal(before.top, after.top);
});
test('invalid stored preferences cannot break layout', () => {
  assert.deepEqual(normalizePreferences(null), defaults);
  assert.deepEqual(normalizePreferences({ width: -1, topSpace: 0 }), { width: 0, topSpace: 0 });
  assert.deepEqual(normalizePreferences({ width: 101, topSpace: -5 }), { width: 100, topSpace: 0 });
  assert.deepEqual(normalizePreferences({ width: 37.4, topSpace: 12.6 }), { width: 37, topSpace: 13 });
  assert.deepEqual(normalizePreferences({ width: 75, alignment: 'bottom', reserve: 200 }), { width: 75, topSpace: 0 });
});
test('very small areas preserve the minimum internal renderer size without overflowing', () => {
  for (const width of [0, 192, 320, 390, 844]) for (const height of [0, 80, 150, 300]) {
    const box = calculateFrame(width, height, defaults);
    const renderer = fitRenderer(box);
    assert.ok(renderer.width >= 340 && renderer.height >= 212);
    assert.ok(renderer.width * renderer.scale <= box.width + 1e-8);
    assert.ok(renderer.height * renderer.scale <= box.height + 1e-8);
    assert.ok(Number.isFinite(renderer.width) && Number.isFinite(renderer.height));
  }
});
