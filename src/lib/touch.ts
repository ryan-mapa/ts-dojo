/**
 * Whether to present the touch affordances (accessory key bar, larger type,
 * no hover cards).
 *
 * `(pointer: coarse)` is the textbook signal and is correct on real phones, but
 * it is not sufficient on its own here. Chrome applies touch emulation
 * asynchronously, so the first page loaded in a fresh browser can report
 * `pointer: fine` and `maxTouchPoints: 0` while still being a touch context —
 * measured directly, not assumed. An untestable branch on the one input path
 * this whole feature is about is not worth the elegance, so we corroborate.
 *
 * The width bound is what keeps the bar off a touchscreen laptop driven with a
 * mouse, while still allowing a tablet in landscape.
 */
export const isTouchLayout = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia('(pointer: coarse)').matches) return true;

  const touchCapable = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  return touchCapable && window.matchMedia('(max-width: 1100px)').matches;
};
