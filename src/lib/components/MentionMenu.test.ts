import { fireEvent, render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import type { MentionItem } from '$lib/types';
import MentionMenu from './MentionMenu.svelte';

const makeItem = (overrides: Partial<MentionItem> = {}): MentionItem => ({
  pubkey: 'pubkey1',
  content: '{}',
  name: 'Alice',
  picture: '',
  nip05: '',
  ...overrides,
});

const baseProps = {
  open: true,
  onOpenChange: () => {},
  getAnchorRect: () => ({ x: 0, y: 0, width: 0, height: 0 }),
  anchorElement: document.createElement('input'),
  onSelect: () => {},
};

const getContent = () => document.body.querySelector('[data-scope="popover"][data-part="content"]');

describe('MentionMenu', () => {
  it('is hidden when open is false', () => {
    render(MentionMenu, {
      props: { ...baseProps, open: false, loading: false, items: [], activeIndex: 0 },
    });

    expect(getContent()).toHaveAttribute('hidden');
  });

  it('shows a loading message while searching, even if stale items are still around', () => {
    render(MentionMenu, {
      props: { ...baseProps, loading: true, items: [makeItem()], activeIndex: 0 },
    });

    expect(getContent()).not.toHaveAttribute('hidden');
    expect(getContent()?.textContent).toContain('Searching...');
    expect(getContent()?.querySelector('button')).toBeNull();
  });

  it('shows a no-matches message once loading finishes with zero results', () => {
    render(MentionMenu, { props: { ...baseProps, loading: false, items: [], activeIndex: 0 } });

    expect(getContent()?.textContent).toContain('No matches found');
    expect(getContent()?.querySelector('button')).toBeNull();
  });

  it('renders a malicious item name as inert text, never as markup', () => {
    const items = [makeItem({ name: '<img src=x onerror=alert(1)>' })];
    render(MentionMenu, { props: { ...baseProps, loading: false, items, activeIndex: 0 } });

    const content = getContent();
    expect(content?.querySelector('img[onerror]')).toBeNull();
    expect(content?.textContent).toContain('<img src=x onerror=alert(1)>');
  });

  it('falls back to a placeholder when an item has no picture', () => {
    const items = [makeItem({ picture: '' })];
    render(MentionMenu, { props: { ...baseProps, loading: false, items, activeIndex: 0 } });

    expect(getContent()?.querySelector('img')).toBeNull();
  });

  it('renders an item picture as an img src, never as injected markup via the picture field', () => {
    const items = [makeItem({ picture: 'x" onerror="alert(1)' })];
    render(MentionMenu, { props: { ...baseProps, loading: false, items, activeIndex: 0 } });

    const img = getContent()?.querySelector('img');
    expect(img).not.toBeNull();
    expect(img).not.toHaveAttribute('onerror');
    expect(img?.getAttribute('src')).toBe('x" onerror="alert(1)');
  });

  it('highlights only the active item and calls onSelect with it on click', async () => {
    const onSelect = vi.fn();
    const items = [
      makeItem({ pubkey: 'a', name: 'Alice' }),
      makeItem({ pubkey: 'b', name: 'Bob' }),
    ];
    render(MentionMenu, {
      props: { ...baseProps, loading: false, items, activeIndex: 1, onSelect },
    });

    const buttons = getContent()?.querySelectorAll('button') ?? [];
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.className).toContain('hover:preset-tonal');
    expect(buttons[0]?.className).not.toContain('preset-tonal ');
    expect(buttons[1]?.className).toContain('preset-tonal');
    expect(buttons[1]?.className).not.toContain('hover:preset-tonal');

    await fireEvent.click(buttons[1] as HTMLButtonElement);

    expect(onSelect).toHaveBeenCalledExactlyOnceWith(items[1]);
  });

  it('renders the nip05 badge only when present', () => {
    const items = [makeItem({ nip05: 'alice@example.com' }), makeItem({ pubkey: 'b', nip05: '' })];
    render(MentionMenu, { props: { ...baseProps, loading: false, items, activeIndex: 0 } });

    const buttons = getContent()?.querySelectorAll('button') ?? [];
    expect(buttons[0]?.querySelector('code')?.textContent).toBe('alice@example.com');
    expect(buttons[1]?.querySelector('code')).toBeNull();
  });
});
