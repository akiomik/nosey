import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement ResizeObserver, which @floating-ui/dom's autoUpdate
// (used by Skeleton's Popover for positioning) relies on. Without this, tests
// that keep a Popover open long enough for autoUpdate to engage throw an
// unhandled rejection from inside a requestAnimationFrame callback.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub;
