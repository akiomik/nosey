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

// jsdom doesn't implement canvas rendering, so HTMLCanvasElement#getContext
// logs a "Not implemented" error and returns null. The autocomplete action
// uses a canvas to measure text width and already falls back gracefully
// when getContext returns null, but the console noise obscures real test
// output, so stub a minimal 2D context here.
HTMLCanvasElement.prototype.getContext = (() => ({
  font: '',
  measureText: (text: string) => ({ width: text.length }),
})) as typeof HTMLCanvasElement.prototype.getContext;
