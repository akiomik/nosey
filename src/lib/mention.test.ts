import { describe, expect, it } from 'vitest';
import { MentionItemSchema } from './mention';

const pubkey = 'a'.repeat(64);

describe('MentionItemSchema', () => {
  it('normalizes profile metadata for display', () => {
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
      content: JSON.stringify({
        name: ' Alice ',
        display_name: 'Different name',
        picture: 'https://example.com/alice.png',
        nip05: '_@example.com',
      }),
      name: 'Alice',
      picture: 'https://example.com/alice.png',
      nip05: 'example.com',
    });
  });

  it('falls back to safe display values for malformed profile content', () => {
    expect(MentionItemSchema.parse({ pubkey, content: '{not valid json' })).toEqual({
      pubkey,
      content: '{not valid json',
      name: pubkey,
      picture: '',
      nip05: '',
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
      content: JSON.stringify({ name: 42, display_name: ' Alice ', picture: {}, nip05: 'bad' }),
      name: 'Alice',
      picture: '',
      nip05: '',
    });
  });
});
