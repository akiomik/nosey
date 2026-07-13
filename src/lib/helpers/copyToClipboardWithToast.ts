import { copyToClipboard } from '$lib/helpers/copyToClipboard';
import { toaster } from '$lib/stores/toaster';

export const copyToClipboardWithToast = async (text: string, label: string): Promise<void> => {
  try {
    await copyToClipboard(text);
    toaster.create({ title: `Copied ${label}`, type: 'success' });
  } catch {
    toaster.create({ title: `Failed to copy ${label}`, type: 'error' });
  }
};
