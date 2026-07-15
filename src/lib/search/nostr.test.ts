import { nip19 } from 'nostr-tools';
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure';
import { describe, expect, it } from 'vitest';
import {
  formatNip05Identifier,
  Nip05IdentifierSchema,
  NostrEventSchema,
  NostrProfileContentSchema,
  npubCodec,
} from './nostr';

const mattnNpub = 'npub1937vv2nf06360qn9y8el6d8sevnndy7tuh5nzre4gj05xc32tnwqauhaj6';

const signedEvent = () =>
  finalizeEvent(
    { kind: 1, created_at: 1_704_067_200, tags: [], content: 'hello' },
    generateSecretKey()
  );

describe('Nostr schemas', () => {
  it('converts a valid npub to and from its hexadecimal public key', () => {
    const { data: pubkey } = nip19.decode(mattnNpub);

    expect(npubCodec.decode(mattnNpub)).toBe(pubkey);
    expect(npubCodec.encode(pubkey as string)).toBe(mattnNpub);
  });

  describe('Nip05IdentifierSchema', () => {
    it('accepts NIP-05 identifiers with the allowed local-part characters', () => {
      expect(Nip05IdentifierSchema.safeParse('Alice-_.9@example.com').success).toBe(true);
      expect(Nip05IdentifierSchema.safeParse('alice@EXAMPLE.com').success).toBe(true);
    });

    it.each([
      'alice+tag@example.com',
      'alice@example.com@invalid',
      'alice@',
      '@example.com',
    ])('rejects an invalid NIP-05 identifier: %s', (identifier) => {
      expect(Nip05IdentifierSchema.safeParse(identifier).success).toBe(false);
    });

    it('formats a root identifier as its domain for display', () => {
      expect(formatNip05Identifier('_@bob.com')).toBe('bob.com');
      expect(formatNip05Identifier('bob@bob.com')).toBe('bob@bob.com');
    });
  });

  describe('NostrProfileContentSchema', () => {
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
  });

  describe('NostrEventSchema', () => {
    it('accepts a structurally valid event with a valid Nostr signature', () => {
      expect(NostrEventSchema.safeParse(signedEvent()).success).toBe(true);
    });

    it('does not retain the signature-verification cache', () => {
      const parsed = NostrEventSchema.parse(signedEvent());

      expect(Object.getOwnPropertySymbols(parsed)).toEqual([]);
    });

    it('rejects an event whose signed content was changed', () => {
      const event = signedEvent();

      expect(NostrEventSchema.safeParse({ ...event, content: 'tampered' }).success).toBe(false);
    });

    it('rejects uppercase hexadecimal event fields', () => {
      const event = signedEvent();

      expect(NostrEventSchema.safeParse({ ...event, id: event.id.toUpperCase() }).success).toBe(
        false
      );
    });

    it('strips fields that are not part of a Nostr event', () => {
      const event = signedEvent();
      const parsed = NostrEventSchema.parse({ ...event, score: 0 });

      expect(parsed).not.toHaveProperty('score');
    });
  });
});
