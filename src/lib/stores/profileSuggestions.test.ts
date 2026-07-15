import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpTooManyRequestsError } from '$lib/errors';
import type { SearchResult } from '$lib/search/result';
import { type ProfileSuggestionsState, profileSuggestions } from './profileSuggestions';

const emptyResult: SearchResult = {
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

const result = (content: string, pubkey = 'a'.repeat(64)): SearchResult => ({
  ...emptyResult,
  data: [
    {
      id: 'b'.repeat(64),
      pubkey,
      created_at: 0,
      kind: 0,
      tags: [],
      content,
      sig: 'c'.repeat(128),
    },
  ],
});

afterEach(() => {
  vi.useRealTimers();
});

describe('profileSuggestions', () => {
  it('debounces queries and exposes parsed suggestion items', async () => {
    vi.useFakeTimers();
    const search = vi.fn().mockResolvedValue(result(JSON.stringify({ name: 'Alice' })));
    const suggestions = profileSuggestions({ search });
    let latest: ProfileSuggestionsState = { loading: false, items: [], error: null };
    const unsubscribe = suggestions.subscribe((state) => {
      latest = state;
    });

    suggestions.search('a');
    suggestions.search('alice');

    expect(latest.loading).toBe(true);
    await vi.advanceTimersByTimeAsync(250);

    expect(search).toHaveBeenCalledTimes(1);
    expect(search).toHaveBeenCalledWith('alice', expect.any(AbortSignal));
    expect(latest).toEqual({
      loading: false,
      items: [expect.objectContaining({ name: 'Alice' })],
      error: null,
    });

    unsubscribe();
    suggestions.destroy();
  });

  it('cancels a pending debounce when the menu closes', async () => {
    vi.useFakeTimers();
    const search = vi.fn().mockResolvedValue(emptyResult);
    const suggestions = profileSuggestions({ search });

    suggestions.search('alice');
    suggestions.cancel();
    await vi.advanceTimersByTimeAsync(250);

    expect(search).not.toHaveBeenCalled();
    suggestions.destroy();
  });

  it('aborts an in-flight request when a newer query supersedes it', async () => {
    vi.useFakeTimers();
    let firstSignal: AbortSignal | undefined;
    const search = vi.fn((query: string, signal: AbortSignal) => {
      if (query === 'alice') {
        firstSignal = signal;
        return new Promise<SearchResult>(() => {});
      }
      return Promise.resolve(result(JSON.stringify({ name: 'Bob' })));
    });
    const suggestions = profileSuggestions({ search });

    suggestions.search('alice');
    await vi.advanceTimersByTimeAsync(250);
    suggestions.search('bob');

    expect(firstSignal?.aborted).toBe(true);
    await vi.advanceTimersByTimeAsync(250);
    expect(search).toHaveBeenLastCalledWith('bob', expect.any(AbortSignal));

    suggestions.destroy();
  });

  it('waits at least one second before retrying a 429 response', async () => {
    vi.useFakeTimers();
    const search = vi
      .fn()
      .mockRejectedValueOnce(new HttpTooManyRequestsError('rate limited'))
      .mockResolvedValueOnce(result(JSON.stringify({ name: 'Alice' })));
    const suggestions = profileSuggestions({ search });

    suggestions.search('alice');
    await vi.advanceTimersByTimeAsync(250);
    expect(search).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(999);
    expect(search).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(search).toHaveBeenCalledTimes(2);

    suggestions.destroy();
  });

  it('does not retry errors other than 429', async () => {
    vi.useFakeTimers();
    const search = vi.fn().mockRejectedValue(new Error('bad gateway'));
    const suggestions = profileSuggestions({ search });
    let latest: ProfileSuggestionsState = { loading: false, items: [], error: null };
    const unsubscribe = suggestions.subscribe((state) => {
      latest = state;
    });

    suggestions.search('alice');
    await vi.advanceTimersByTimeAsync(250);
    await vi.advanceTimersByTimeAsync(3_000);

    expect(search).toHaveBeenCalledTimes(1);
    expect(latest.error).toBe('unavailable');
    unsubscribe();
    suggestions.destroy();
  });

  it('reports a timeout separately from an unavailable service', async () => {
    vi.useFakeTimers();
    const suggestions = profileSuggestions({
      search: vi.fn(() => new Promise<SearchResult>(() => {})),
      timeoutMs: 100,
    });
    let latest: ProfileSuggestionsState = { loading: false, items: [], error: null };
    const unsubscribe = suggestions.subscribe((state) => {
      latest = state;
    });

    suggestions.search('alice');
    await vi.advanceTimersByTimeAsync(350);

    expect(latest).toEqual({ loading: false, items: [], error: 'timeout' });
    unsubscribe();
    suggestions.destroy();
  });

  it('falls back to the pubkey for malformed profile JSON', async () => {
    vi.useFakeTimers();
    const pubkey = 'd'.repeat(64);
    const suggestions = profileSuggestions({
      search: vi.fn().mockResolvedValue(result('{not valid json', pubkey)),
    });
    let latestName = '';
    const unsubscribe = suggestions.subscribe((state) => {
      latestName = state.items[0]?.name ?? '';
    });

    suggestions.search('alice');
    await vi.advanceTimersByTimeAsync(250);

    expect(latestName).toBe(pubkey);
    unsubscribe();
    suggestions.destroy();
  });
});
