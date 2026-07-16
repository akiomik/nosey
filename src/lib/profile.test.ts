import { describe, expect, it } from 'vitest';
import { zostr } from 'zod-nostr';
import {
  ProfileContentSchema,
  resolveDisplayName,
  resolveIdentifiedProfile,
  resolveNip05Display,
} from './profile';

const pubkey = 'a'.repeat(64);

describe('Nostr profile metadata', () => {
  it('uses zod-nostr to validate and format NIP-05 identifiers', () => {
    expect(zostr.nip05.identifier().safeParse('Alice-_.9@example.com').success).toBe(true);
    expect(zostr.nip05.identifier().safeParse('alice+tag@example.com').success).toBe(false);
    expect(zostr.nip05.formatIdentifier('_@bob.com')).toBe('bob.com');
  });

  it('drops malformed profile properties while retaining valid ones', () => {
    expect(
      ProfileContentSchema.parse(
        JSON.stringify({
          name: 42,
          display_name: ' Alice ',
          picture: {},
          nip05: 'alice+tag@example.com',
          about: 'Ignored by this schema',
        })
      )
    ).toEqual({ name: '', display_name: 'Alice', picture: '', nip05: '' });
  });

  it.each(['not json', 'null', '[]'])('rejects invalid profile content: %s', (content) => {
    expect(ProfileContentSchema.safeParse(content).success).toBe(false);
  });
});

describe('resolveIdentifiedProfile', () => {
  it('resolves valid profile content', () => {
    expect(
      resolveIdentifiedProfile(pubkey, JSON.stringify({ name: 'Alice' })).profile
    ).toMatchObject({ name: 'Alice' });
  });

  it('falls back to an empty profile for missing or invalid content', () => {
    expect(resolveIdentifiedProfile(pubkey).profile).toEqual({
      name: '',
      display_name: '',
      picture: '',
      nip05: '',
    });
    expect(resolveIdentifiedProfile(pubkey, 'not json').profile).toEqual({
      name: '',
      display_name: '',
      picture: '',
      nip05: '',
    });
  });
});

describe('resolveDisplayName', () => {
  it('resolves a display name by name, display name, then a shortened pubkey', () => {
    expect(
      resolveDisplayName(
        resolveIdentifiedProfile(
          pubkey,
          JSON.stringify({ name: 'Alice', display_name: 'Different' })
        )
      )
    ).toBe('Alice');
    expect(
      resolveDisplayName(
        resolveIdentifiedProfile(pubkey, JSON.stringify({ display_name: 'Alice' }))
      )
    ).toBe('Alice');
    expect(resolveDisplayName(resolveIdentifiedProfile(pubkey, '{}'))).toBe('aaaaaaaaa:aaaaaaaa');
  });
});

describe('resolveNip05Display', () => {
  it('formats the identifier for display', () => {
    expect(
      resolveNip05Display(resolveIdentifiedProfile(pubkey, JSON.stringify({ nip05: '_@bob.com' })))
    ).toBe('bob.com');
  });

  it('returns an empty string when there is no identifier', () => {
    expect(resolveNip05Display(resolveIdentifiedProfile(pubkey, '{}'))).toBe('');
  });
});
