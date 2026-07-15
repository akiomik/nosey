import { fireEvent, render } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { verifyNip05 } from '$lib/nip05';
import NoteListItem from './NoteListItem.svelte';

vi.mock('$lib/nip05', async (importOriginal) => ({
  ...(await importOriginal<typeof import('$lib/nip05')>()),
  verifyNip05: vi.fn(),
}));

const mockedVerifyNip05 = vi.mocked(verifyNip05);

beforeEach(() => {
  mockedVerifyNip05.mockReset();
  mockedVerifyNip05.mockReturnValue(new Promise(() => {}));
});

const note = {
  id: 'a'.repeat(64),
  pubkey: 'b'.repeat(64),
  created_at: 1_700_000_000,
  kind: 1,
  tags: [],
  content: 'A note',
  sig: 'c'.repeat(128),
};

const profile = (content: string) => ({
  id: 'd'.repeat(64),
  pubkey: note.pubkey,
  created_at: 1_700_000_001,
  kind: 0,
  tags: [],
  content,
  sig: 'e'.repeat(128),
});

describe('NoteListItem', () => {
  it('uses the same name and picture fallbacks as profile suggestions', () => {
    const { container } = render(NoteListItem, {
      props: {
        note,
        profile: profile(JSON.stringify({ name: 42, display_name: ' Alice ', picture: {} })),
      },
    });

    expect(container).toHaveTextContent('Alice');
    expect(container.querySelector('img')).toHaveAttribute('hidden');
  });

  it('prefers name and renders a valid profile picture', () => {
    const { container } = render(NoteListItem, {
      props: {
        note,
        profile: profile(
          JSON.stringify({
            name: 'Alice',
            display_name: 'Different name',
            picture: 'https://example.com/alice.png',
          })
        ),
      },
    });

    expect(container).toHaveTextContent('Alice');
    expect(container).not.toHaveTextContent('Different name');
    expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/alice.png');
  });

  it('falls back to a shortened pubkey when profile content is malformed', () => {
    const { container } = render(NoteListItem, {
      props: { note, profile: profile('{not valid json') },
    });

    expect(container).toHaveTextContent('bbbbbbbbb:bbbbbbbb');
    expect(container.querySelector('img')).toHaveAttribute('hidden');
  });

  it('shows the nip05 identifier and verifies it, displaying a check icon once confirmed', async () => {
    mockedVerifyNip05.mockResolvedValue(true);

    const { container } = render(NoteListItem, {
      props: {
        note,
        profile: profile(JSON.stringify({ name: 'Alice', nip05: 'alice@example.com' })),
      },
    });

    expect(container.querySelector('code')?.textContent).toBe('alice@example.com');
    expect(mockedVerifyNip05).toHaveBeenCalledExactlyOnceWith(note.pubkey, 'alice@example.com');
    await vi.waitFor(() => {
      expect(container.querySelector('svg[data-icon="circle-check"]')).not.toBeNull();
    });
  });

  it('strips the "_@" local part when displaying a domain-only nip05 identifier', () => {
    const { container } = render(NoteListItem, {
      props: {
        note,
        profile: profile(JSON.stringify({ name: 'Alice', nip05: '_@example.com' })),
      },
    });

    expect(container.querySelector('code')?.textContent).toBe('example.com');
    expect(mockedVerifyNip05).toHaveBeenCalledExactlyOnceWith(note.pubkey, '_@example.com');
  });

  it('does not show a nip05 identifier or verify when absent from the profile', () => {
    const { container } = render(NoteListItem, {
      props: { note, profile: profile(JSON.stringify({ name: 'Alice' })) },
    });

    expect(container.querySelector('code')).toBeNull();
    expect(mockedVerifyNip05).not.toHaveBeenCalled();
  });

  describe('long-post collapsing', () => {
    const withContent = (content: string) => ({ ...note, content });

    it('does not show a "Show more" trigger for short posts', () => {
      const { queryByRole } = render(NoteListItem, {
        props: { note: withContent('A short note'), profile: undefined },
      });

      expect(queryByRole('button', { name: 'Show more' })).toBeNull();
    });

    it('shows a "Show more" trigger for posts past the length threshold', () => {
      const { getByRole } = render(NoteListItem, {
        props: { note: withContent('a'.repeat(600)), profile: undefined },
      });

      expect(getByRole('button', { name: 'Show more' })).toBeInTheDocument();
    });

    it('does not show a "Show more" trigger for a short-caption post with an image until its rendered height is measured to overflow', () => {
      // jsdom doesn't lay out elements, so the ResizeObserver that would
      // normally reveal the trigger for a tall image never fires here. That's
      // the point: a short image must never get a trigger it doesn't need
      // (regression test for it being padded out to a fixed height with a
      // trigger that revealed nothing), and confirming this measurement path
      // is skipped in this environment is as far as a unit test can go —
      // whether a genuinely tall image later reveals the trigger is a
      // layout-dependent behavior verified manually in a real browser.
      const { queryByRole } = render(NoteListItem, {
        props: {
          note: withContent('Check this out https://example.com/photo.png'),
          profile: undefined,
        },
      });

      expect(queryByRole('button', { name: 'Show more' })).toBeNull();
    });

    it('toggles the trigger label between "Show more" and "Show less" when clicked', async () => {
      const { getByRole } = render(NoteListItem, {
        props: { note: withContent('a'.repeat(600)), profile: undefined },
      });

      const trigger = getByRole('button', { name: 'Show more' });
      await fireEvent.click(trigger);
      expect(trigger).toHaveTextContent('Show less');

      await fireEvent.click(trigger);
      expect(trigger).toHaveTextContent('Show more');
    });

    it('lets unbreakable long tokens (e.g. an unreplaced nostr: identifier) wrap instead of overflowing the card, for both short and long posts', () => {
      const shortWithRawIdentifier = withContent(`nostr:nevent1${'q'.repeat(70)}`);
      const { container: shortContainer } = render(NoteListItem, {
        props: { note: shortWithRawIdentifier, profile: undefined },
      });
      expect(shortContainer.querySelector('p.break-words')).not.toBeNull();

      const { container: longContainer } = render(NoteListItem, {
        props: { note: withContent('a'.repeat(600)), profile: undefined },
      });
      expect(longContainer.querySelector('p.break-words')).not.toBeNull();
    });
  });
});
