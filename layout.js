export const defaults = Object.freeze({ width: 100, topSpace: 0 });

export function normalizePreferences(value) {
  const v = value && typeof value === 'object' ? value : {};
  const bounded = (n, low, high, fallback) => typeof n === 'number' && Number.isFinite(n) ? Math.min(high, Math.max(low, Math.round(n))) : fallback;
  return {
    width: bounded(v.width, 0, 100, defaults.width),
    topSpace: bounded(v.topSpace, 0, Number.MAX_SAFE_INTEGER, defaults.topSpace),
  };
}

// The terminal defaults to 80 columns, 24 rows, with cells twice as tall as wide.
// Its renderer also uses a small gutter. Size the frame; never recreate it.
export function calculateFrame(stageWidth, stageHeight, preferences) {
  const p = normalizePreferences(preferences);
  const width = Math.max(0, stageWidth) * p.width / 100;
  const availableHeight = Math.max(0, stageHeight - p.topSpace);
  const height = width === 0 ? 0 : Math.min(availableHeight, width * 24 * 2 / 80 + 10);
  return { width, height, left: (Math.max(0, stageWidth) - width) / 2, top: p.topSpace };
}

// Below the official renderer's minimum font size, shrink the whole iframe.
// Keep a valid internal viewport even when the available area reaches zero.
export function fitRenderer(box) {
  const scale = Math.min(1, box.width / 340, box.height / 212);
  return { width: scale > 0 ? Math.max(340, box.width / scale) : 340,
    height: scale > 0 ? Math.max(212, box.height / scale) : 212, scale };
}
