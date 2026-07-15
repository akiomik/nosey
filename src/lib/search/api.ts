import { z } from 'zod';
import { HttpBadGatewayError, HttpBadRequestError, HttpTooManyRequestsError } from '$lib/errors';
import { type SearchApiRequest, SearchApiRequestSchema } from './request';
import { type SearchResult, SearchResultSchema } from './result';

const endpoint = 'https://api.nostr.wine/search';

const epochSeconds = z.date().transform((date) => Math.floor(date.getTime() / 1_000).toString());

export const SearchApiParamsSchema = SearchApiRequestSchema.transform((request) => {
  const params = new URLSearchParams();
  if (request.query) params.set('query', request.query);
  if (request.pubkey) params.set('pubkey', request.pubkey);
  if (request.since) params.set('since', epochSeconds.parse(request.since));
  if (request.until) params.set('until', epochSeconds.parse(request.until));
  if (request.kind !== undefined) params.set('kind', request.kind.toString());
  if (request.limit !== undefined) params.set('limit', request.limit.toString());
  if (request.sort) params.set('sort', request.sort);
  if (request.page !== undefined) params.set('page', request.page.toString());
  return params;
});

function parseRetryAfter(value: string | null): number | undefined {
  if (!value) {
    return undefined;
  }

  const seconds = Number(value);
  if (Number.isFinite(seconds)) {
    return Math.max(0, Math.ceil(seconds * 1_000));
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return undefined;
  }

  return Math.max(0, timestamp - Date.now());
}

const errorMessage = (data: unknown, fallback: string): string => {
  if (data && typeof data === 'object' && 'error' in data) {
    return JSON.stringify(data.error);
  }

  return JSON.stringify({ error: fallback });
};

const invalidResponse = () =>
  new HttpBadGatewayError(JSON.stringify({ error: 'Search API returned an invalid response' }));

export async function search(
  request: SearchApiRequest,
  signal?: AbortSignal
): Promise<SearchResult> {
  const params = SearchApiParamsSchema.parse(request);
  const response = await fetch(`${endpoint}?${params}`, { signal });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw invalidResponse();
  }

  if (!response.ok) {
    const message = errorMessage(data, 'Search API request failed');
    if (response.status === 429) {
      throw new HttpTooManyRequestsError(
        message,
        parseRetryAfter(response.headers.get('Retry-After'))
      );
    }
    if (response.status < 500) {
      throw new HttpBadRequestError(message);
    }
    throw new HttpBadGatewayError(message);
  }

  const result = SearchResultSchema.safeParse(data);
  if (!result.success) {
    throw invalidResponse();
  }

  return result.data;
}
