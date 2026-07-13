import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { HttpBadGatewayError, HttpBadRequestError } from '$lib/errors';
import type { SearchResult } from '$lib/types';
import { search } from './search';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('search', () => {
  it('returns the parsed search result on success', async () => {
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
    server.use(http.get('https://api.nostr.wine/search', () => HttpResponse.json(result)));

    await expect(search({ query: 'hello' })).resolves.toEqual(result);
  });

  it('throws HttpBadRequestError on a 4xx response', async () => {
    server.use(
      http.get('https://api.nostr.wine/search', () =>
        HttpResponse.json({ error: 'bad request' }, { status: 400 })
      )
    );

    await expect(search({ query: 'hello' })).rejects.toThrow(HttpBadRequestError);
  });

  it('throws HttpBadGatewayError on a 5xx response', async () => {
    server.use(
      http.get('https://api.nostr.wine/search', () =>
        HttpResponse.json({ error: 'oops' }, { status: 502 })
      )
    );

    await expect(search({ query: 'hello' })).rejects.toThrow(HttpBadGatewayError);
  });

  it('encodes since/until as unix timestamps and omits empty fields', async () => {
    let requestUrl: string | undefined;
    server.use(
      http.get('https://api.nostr.wine/search', ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json({
          data: [],
          pagination: {
            last_page: true,
            limit: 20,
            next_url: '',
            page: 0,
            total_pages: 1,
            total_records: 0,
          },
        });
      })
    );

    await search({ query: 'hello', pubkey: '', since: new Date('2024-01-01T00:00:00Z') });

    const params = new URL(requestUrl ?? '').searchParams;
    expect(params.get('query')).toBe('hello');
    expect(params.get('since')).toBe(
      Math.floor(new Date('2024-01-01T00:00:00Z').getTime() / 1000).toString()
    );
    expect(params.has('pubkey')).toBe(false);
  });
});
