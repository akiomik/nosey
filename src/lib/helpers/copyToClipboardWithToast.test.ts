import { beforeEach, describe, expect, it, vi } from 'vitest';

const { copyToClipboard } = vi.hoisted(() => ({ copyToClipboard: vi.fn() }));
const { toaster } = vi.hoisted(() => ({ toaster: { create: vi.fn() } }));

vi.mock('$lib/helpers/copyToClipboard', () => ({ copyToClipboard }));
vi.mock('$lib/stores/toaster', () => ({ toaster }));

const { copyToClipboardWithToast } = await import('./copyToClipboardWithToast');

describe('copyToClipboardWithToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('copies the text and shows a success toast', async () => {
    copyToClipboard.mockResolvedValue(undefined);

    await copyToClipboardWithToast('hello', 'npub1');

    expect(copyToClipboard).toHaveBeenCalledWith('hello');
    expect(toaster.create).toHaveBeenCalledExactlyOnceWith({
      title: 'Copied npub1',
      type: 'success',
    });
  });

  it('shows an error toast when copying fails', async () => {
    copyToClipboard.mockRejectedValue(new Error('denied'));

    await copyToClipboardWithToast('hello', 'npub1');

    expect(toaster.create).toHaveBeenCalledExactlyOnceWith({
      title: 'Failed to copy npub1',
      type: 'error',
    });
  });
});
