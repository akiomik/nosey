import { describe, expect, it } from 'vitest';
import { MentionItemSchema } from './mention';

const pubkey = 'a'.repeat(64);

describe('MentionItemSchema', () => {
  it('resolves profile metadata into an IdentifiedProfile', () => {
    expect(
      MentionItemSchema.parse({
        pubkey,
        content: JSON.stringify({
          name: ' Alice ',
          display_name: 'Different name',
          picture: 'https://example.com/alice.png',
          nip05: '_@example.com',
        }),
      })
    ).toEqual({
      pubkey,
      profile: {
        name: 'Alice',
        display_name: 'Different name',
        picture: 'https://example.com/alice.png',
        nip05: '_@example.com',
      },
    });
  });

  it('falls back to an empty profile for malformed profile content', () => {
    expect(MentionItemSchema.parse({ pubkey, content: '{not valid json' })).toEqual({
      pubkey,
      profile: { name: '', display_name: '', picture: '', nip05: '' },
    });
  });

  it('drops malformed profile properties while retaining valid ones', () => {
    expect(
      MentionItemSchema.parse({
        pubkey,
        content: JSON.stringify({ name: 42, display_name: ' Alice ', picture: {}, nip05: 'bad' }),
      })
    ).toEqual({
      pubkey,
      profile: { name: '', display_name: 'Alice', picture: '', nip05: '' },
    });
  });
});
