import { describe, expect, it } from 'vitest';
import { isoDateCodec, SearchFiltersSchema } from './filters';

describe('search filters', () => {
  it('converts ISO dates at UTC midnight and rejects malformed dates', () => {
    expect(isoDateCodec.decode('2024-01-01')).toEqual(new Date('2024-01-01T00:00:00.000Z'));
    expect(isoDateCodec.safeDecode('2024-02-30').success).toBe(false);
  });

  it('rejects reversed date ranges', () => {
    expect(
      SearchFiltersSchema.safeParse({
        since: new Date('2024-12-31T00:00:00.000Z'),
        until: new Date('2024-01-01T00:00:00.000Z'),
      }).success
    ).toBe(false);
  });
});
