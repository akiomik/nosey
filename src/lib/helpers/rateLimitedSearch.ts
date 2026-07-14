import { HttpTooManyRequestsError } from '$lib/errors';
import { search } from '$lib/helpers/search';
import type { SearchQuery, SearchResult } from '$lib/types';

const MINIMUM_REQUEST_INTERVAL_MS = 1_000;

type Search = (query: Partial<SearchQuery>, signal?: AbortSignal) => Promise<SearchResult>;

const abortError = () => new DOMException('The operation was aborted', 'AbortError');

const wait = (durationMs: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, durationMs);
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });

export const createRateLimitedSearch = (
  request: Search = search,
  minimumIntervalMs = MINIMUM_REQUEST_INTERVAL_MS
): Search => {
  let nextRequestAt = 0;
  let reservationQueue = Promise.resolve();

  const reserveRequestSlot = (signal?: AbortSignal) => {
    const reservation = reservationQueue.then(async () => {
      while (true) {
        if (signal?.aborted) {
          throw abortError();
        }

        const delayMs = nextRequestAt - Date.now();
        if (delayMs <= 0) {
          nextRequestAt = Date.now() + minimumIntervalMs;
          return;
        }

        await wait(delayMs, signal);
      }
    });

    reservationQueue = reservation.catch(() => undefined);
    return reservation;
  };

  return async (query, signal) => {
    await reserveRequestSlot(signal);

    try {
      return await request(query, signal);
    } catch (error) {
      if (error instanceof HttpTooManyRequestsError) {
        const retryDelayMs = Math.max(error.retryAfterMs ?? minimumIntervalMs, minimumIntervalMs);
        nextRequestAt = Math.max(nextRequestAt, Date.now() + retryDelayMs);
      }
      throw error;
    }
  };
};

// All client-side profile suggestion inputs share this coordinator, so their
// requests respect api.nostr.wine's one-request-per-second limit together.
export const rateLimitedSearch = createRateLimitedSearch();
