import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { finalizeEvent, generateSecretKey } from 'nostr-tools/pure';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { HttpBadGatewayError, HttpBadRequestError } from '$lib/errors';
import { SearchApiParamsSchema, search } from './api';
import type { SearchResult } from './result';

const server = setupServer();

const pagination = {
  last_page: true,
  limit: 20,
  next_url: '',
  page: 0,
  total_pages: 1,
  total_records: 0,
};

const signedEvent = (content = 'hello') =>
  finalizeEvent({ kind: 1, created_at: 1_704_067_200, tags: [], content }, generateSecretKey());

const result = (data: SearchResult['data'] = []): SearchResult => ({ data, pagination });

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('search', () => {
  it('serializes validated requests directly into URLSearchParams', () => {
    const params = SearchApiParamsSchema.parse({
      query: 'hello',
      kind: 1,
      since: new Date('2024-01-01T00:00:00Z'),
    });

    expect(params).toBeInstanceOf(URLSearchParams);
    expect(params.toString()).toBe('query=hello&since=1704067200&kind=1');
  });

  it('returns a structurally valid response whose events have valid signatures', async () => {
    const response = result([signedEvent()]);
    server.use(http.get('https://api.nostr.wine/search', () => HttpResponse.json(response)));

    await expect(search({ query: 'hello' })).resolves.toEqual(JSON.parse(JSON.stringify(response)));
  });

  it('rejects a response containing an event with an invalid signature', async () => {
    const event = signedEvent();
    const response = result([{ ...event, content: 'tampered' }]);
    server.use(http.get('https://api.nostr.wine/search', () => HttpResponse.json(response)));

    await expect(search({ query: 'hello' })).rejects.toThrow(HttpBadGatewayError);
  });

  it('rejects malformed successful responses', async () => {
    server.use(http.get('https://api.nostr.wine/search', () => HttpResponse.json({ data: [] })));

    await expect(search({ query: 'hello' })).rejects.toThrow(HttpBadGatewayError);
  });

  it('throws HttpBadRequestError on a 4xx response', async () => {
    server.use(
      http.get('https://api.nostr.wine/search', () =>
        HttpResponse.json({ error: 'bad request' }, { status: 400 })
      )
    );

    await expect(search({ query: 'hello' })).rejects.toThrow(HttpBadRequestError);
  });

  it('encodes dates as Unix timestamps and omits absent fields', async () => {
    let requestUrl: string | undefined;
    server.use(
      http.get('https://api.nostr.wine/search', ({ request }) => {
        requestUrl = request.url;
        return HttpResponse.json(result());
      })
    );

    await search({ query: 'hello', since: new Date('2024-01-01T00:00:00Z') });

    const params = new URL(requestUrl ?? '').searchParams;
    expect(params.get('query')).toBe('hello');
    expect(params.get('since')).toBe('1704067200');
    expect(params.has('pubkey')).toBe(false);
  });
});
