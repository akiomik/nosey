import { HttpTooManyRequestsError } from '$lib/errors';
import { search } from './api';
import type { SearchApiRequest } from './request';
import type { SearchResult } from './result';

const MINIMUM_REQUEST_INTERVAL_MS = 1_000;

type Search = (request: SearchApiRequest, signal?: AbortSignal) => Promise<SearchResult>;

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
  performSearch: Search = search,
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

  return async (request, signal) => {
    await reserveRequestSlot(signal);

    try {
      return await performSearch(request, signal);
    } catch (error) {
      if (error instanceof HttpTooManyRequestsError) {
        const retryDelayMs = Math.max(error.retryAfterMs ?? minimumIntervalMs, minimumIntervalMs);
        nextRequestAt = Math.max(nextRequestAt, Date.now() + retryDelayMs);
      }
      throw error;
    }
  };
};

export const rateLimitedSearch = createRateLimitedSearch();
