import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure';
import { describe, expect, it } from 'vitest';
import { SearchResultSchema, VerifiedNostrEventSchema } from './result';

const signedEvent = () =>
  finalizeEvent(
    { kind: 1, created_at: 1_704_067_200, tags: [], content: 'hello' },
    generateSecretKey()
  );

describe('search result schemas', () => {
  it('accepts a structurally valid event with a valid Nostr signature', () => {
    expect(VerifiedNostrEventSchema.safeParse(signedEvent()).success).toBe(true);
  });

  it('does not retain the signature-verification cache', () => {
    const parsed = VerifiedNostrEventSchema.parse(signedEvent());

    expect(Object.getOwnPropertySymbols(parsed)).toEqual([]);
  });

  it('rejects an event whose signed content was changed', () => {
    const event = signedEvent();

    expect(VerifiedNostrEventSchema.safeParse({ ...event, content: 'tampered' }).success).toBe(
      false
    );
  });

  it('rejects uppercase hexadecimal event fields', () => {
    const event = signedEvent();

    expect(
      VerifiedNostrEventSchema.safeParse({ ...event, id: event.id.toUpperCase() }).success
    ).toBe(false);
  });

  it('strips fields that are not part of a Nostr event', () => {
    const event = signedEvent();
    const parsed = VerifiedNostrEventSchema.parse({ ...event, score: 0 });

    expect(parsed).not.toHaveProperty('score');
  });

  it('rejects responses containing more events than the requested maximum', () => {
    const event = signedEvent();
    const response = {
      data: Array.from({ length: 101 }, () => event),
      pagination: {
        last_page: true,
        limit: 100,
        next_url: '',
        page: 1,
        total_pages: 1,
        total_records: 101,
      },
    };

    expect(SearchResultSchema.safeParse(response).success).toBe(false);
  });
});
