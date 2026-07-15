import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import NoteListItem from './NoteListItem.svelte';

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
});
