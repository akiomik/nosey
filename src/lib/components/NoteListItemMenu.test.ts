import { fireEvent, render } from '@testing-library/svelte';
import { nip19 } from 'nostr-tools';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyToClipboardWithToast } from '$lib/helpers/copyToClipboardWithToast';
import NoteListItemMenu from './NoteListItemMenu.svelte';

vi.mock('$lib/helpers/copyToClipboardWithToast', () => ({
  copyToClipboardWithToast: vi.fn(),
}));

const note = {
  id: 'a'.repeat(64),
  pubkey: 'b'.repeat(64),
  created_at: 1_700_000_000,
  kind: 1,
  tags: [],
  content: 'A note to copy',
  sig: 'c'.repeat(128),
};

const getElement = (selector: string) => {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Expected element matching ${selector}`);
  return element as HTMLElement;
};

const openMenu = async (container: HTMLElement) => {
  await fireEvent.click(
    container.querySelector('[data-scope="menu"][data-part="trigger"]') as HTMLElement
  );
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('NoteListItemMenu', () => {
  it('renders and opens independently with all note actions', async () => {
    const { container } = render(NoteListItemMenu, { props: { note } });
    const menuContent = getElement('[data-scope="menu"][data-part="content"]');

    expect(menuContent).toHaveAttribute('hidden');
    await openMenu(container);

    expect(menuContent).not.toHaveAttribute('hidden');
    expect(menuContent).toHaveTextContent('Copy npub1');
    expect(menuContent).toHaveTextContent('Copy note1 id');
    expect(menuContent).toHaveTextContent('Copy nevent1 id');
    expect(menuContent).toHaveTextContent('Copy text');
    expect(menuContent).toHaveTextContent('Open author with njump.me');
    expect(menuContent).toHaveTextContent('Open note with njump.me');
    expect(menuContent).toHaveTextContent('See posts around this on Nosaray');
  });

  it('copies the requested encoded value and closes its Menu', async () => {
    const { container } = render(NoteListItemMenu, { props: { note } });
    const menuContent = getElement('[data-scope="menu"][data-part="content"]');
    await openMenu(container);

    await fireEvent.click(
      getElement('[data-scope="menu"][data-part="item"][data-value="copy-npub"]')
    );

    expect(copyToClipboardWithToast).toHaveBeenCalledWith(nip19.npubEncode(note.pubkey), 'npub1');
    expect(menuContent).toHaveAttribute('hidden');
  });

  it('opens external menu links in a new window when selected with the keyboard', async () => {
    const { container } = render(NoteListItemMenu, { props: { note } });
    const menuContent = getElement('[data-scope="menu"][data-part="content"]');
    const open = vi.spyOn(window, 'open').mockImplementation(() => null);
    await openMenu(container);

    for (let i = 0; i < 5; i += 1) {
      await fireEvent.keyDown(menuContent, { key: 'ArrowDown' });
    }
    await fireEvent.keyDown(menuContent, { key: 'Enter' });

    expect(open).toHaveBeenCalledWith(
      `https://njump.me/${nip19.npubEncode(note.pubkey)}`,
      '_blank',
      'noreferrer'
    );
    expect(menuContent).toHaveAttribute('hidden');
  });
});
