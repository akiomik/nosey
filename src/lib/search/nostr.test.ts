import { nip19 } from 'nostr-tools';
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure';
import { describe, expect, it } from 'vitest';
import { NostrEventSchema, npubCodec } from './nostr';

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
