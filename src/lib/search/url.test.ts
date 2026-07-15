import { describe, expect, it } from 'vitest';
import { SearchUrlSchema } from './url';

describe('SearchUrlSchema', () => {
  it('decodes q into structured filters and page into a number', () => {
    expect(SearchUrlSchema.parse({ q: 'hello since:2024-01-01', page: '2' })).toEqual({
      q: { query: 'hello', since: new Date('2024-01-01T00:00:00.000Z') },
      page: 2,
    });
  });

  it('rejects empty, fractional, negative, and partially numeric page values', () => {
    expect(SearchUrlSchema.safeParse({ page: '' }).success).toBe(false);
    expect(SearchUrlSchema.safeParse({ page: ' ' }).success).toBe(false);
    expect(SearchUrlSchema.safeParse({ page: '1abc' }).success).toBe(false);
    expect(SearchUrlSchema.safeParse({ page: '1.5' }).success).toBe(false);
    expect(SearchUrlSchema.safeParse({ page: '-1' }).success).toBe(false);
  });

  it('accepts numeric strings supported by Number coercion', () => {
    expect(SearchUrlSchema.parse({ page: '1e2' })).toEqual({ page: 100 });
  });
});
