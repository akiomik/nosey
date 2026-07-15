import { render } from '@testing-library/svelte';
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
});
