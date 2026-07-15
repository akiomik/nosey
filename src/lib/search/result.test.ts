import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure';
import { describe, expect, it } from 'vitest';
import { SearchResultSchema } from './result';

const signedEvent = () =>
  finalizeEvent(
    { kind: 1, created_at: 1_704_067_200, tags: [], content: 'hello' },
    generateSecretKey()
  );

describe('search result schemas', () => {
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
