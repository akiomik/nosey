import { describe, expect, it } from 'vitest';
import {
  createNoteSearchRequest,
  createProfileSuggestionRequest,
  SearchApiRequestSchema,
} from './request';

describe('SearchApiRequestSchema', () => {
  it('requires a selector rather than accepting pagination controls alone', () => {
    expect(SearchApiRequestSchema.safeParse({ limit: 10, page: 1 }).success).toBe(false);
  });

  it('inherits the filter date-range constraint', () => {
    expect(
      SearchApiRequestSchema.safeParse({
        since: new Date('2024-12-31T00:00:00.000Z'),
        until: new Date('2024-01-01T00:00:00.000Z'),
      }).success
    ).toBe(false);
  });

  it('supports the limited profile-suggestion request shape', () => {
    expect(createProfileSuggestionRequest('alice', 10)).toEqual({
      query: 'alice',
      kind: 0,
      limit: 10,
    });
  });

  it('adds page-specific controls to note searches', () => {
    expect(createNoteSearchRequest({ query: 'hello' }, 0)).toEqual({
      query: 'hello',
      kind: 1,
      limit: 100,
      sort: 'time',
      page: 1,
    });
  });
});
