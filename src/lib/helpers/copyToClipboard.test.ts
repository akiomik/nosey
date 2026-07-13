import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboard } from './copyToClipboard';

describe('copyToClipboard', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('writes the given text to the clipboard', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    await copyToClipboard('hello');

    expect(writeText).toHaveBeenCalledWith('hello');
  });
});
