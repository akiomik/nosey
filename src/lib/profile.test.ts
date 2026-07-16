import { describe, expect, it } from 'vitest';
import { zostr } from 'zod-nostr';
import { NostrProfileContentSchema, resolveProfileDisplayName } from './profile';

describe('Nostr profile metadata', () => {
  it('uses zod-nostr to validate and format NIP-05 identifiers', () => {
    expect(zostr.nip05.identifier().safeParse('Alice-_.9@example.com').success).toBe(true);
    expect(zostr.nip05.identifier().safeParse('alice+tag@example.com').success).toBe(false);
    expect(zostr.nip05.formatIdentifier('_@bob.com')).toBe('bob.com');
  });

  it('drops malformed profile properties while retaining valid ones', () => {
    expect(
      NostrProfileContentSchema.parse(
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
    expect(NostrProfileContentSchema.safeParse(content).success).toBe(false);
  });

  it('resolves a display name by name, display name, then fallback', () => {
    expect(
      resolveProfileDisplayName(
        NostrProfileContentSchema.parse(
          JSON.stringify({ name: 'Alice', display_name: 'Different' })
        ),
        'fallback'
      )
    ).toBe('Alice');
    expect(
      resolveProfileDisplayName(
        NostrProfileContentSchema.parse(JSON.stringify({ display_name: 'Alice' })),
        'fallback'
      )
    ).toBe('Alice');
    expect(resolveProfileDisplayName(NostrProfileContentSchema.parse('{}'), 'fallback')).toBe(
      'fallback'
    );
  });
});
