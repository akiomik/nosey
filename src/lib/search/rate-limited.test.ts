import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpTooManyRequestsError } from '$lib/errors';
import { createRateLimitedSearch } from './rate-limited';
import type { SearchResult } from './result';

const result: SearchResult = {
  data: [],
  pagination: {
    last_page: true,
    limit: 20,
    next_url: '',
    page: 0,
    total_pages: 1,
    total_records: 0,
  },
};

afterEach(() => {
  vi.useRealTimers();
});

describe('createRateLimitedSearch', () => {
  it('spaces shared requests at least the configured interval apart', async () => {
    vi.useFakeTimers();
    const search = vi.fn().mockResolvedValue(result);
    const rateLimitedSearch = createRateLimitedSearch(search, 1_000);

    const first = rateLimitedSearch({ query: 'alice' });
    const second = rateLimitedSearch({ query: 'bob' });
    await vi.advanceTimersByTimeAsync(0);

    expect(search).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(999);
    expect(search).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(search).toHaveBeenCalledTimes(2);

    await expect(first).resolves.toEqual(result);
    await expect(second).resolves.toEqual(result);
  });

  it('honors a 429 Retry-After delay before releasing the next request', async () => {
    vi.useFakeTimers();
    const search = vi
      .fn()
      .mockRejectedValueOnce(new HttpTooManyRequestsError('rate limited', 2_000))
      .mockResolvedValueOnce(result);
    const rateLimitedSearch = createRateLimitedSearch(search, 1_000);

    const first = rateLimitedSearch({ query: 'alice' });
    const firstRejected = expect(first).rejects.toThrow(HttpTooManyRequestsError);
    await vi.advanceTimersByTimeAsync(0);
    await firstRejected;

    const second = rateLimitedSearch({ query: 'bob' });
    await vi.advanceTimersByTimeAsync(1_999);
    expect(search).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(search).toHaveBeenCalledTimes(2);

    await expect(second).resolves.toEqual(result);
  });
});
