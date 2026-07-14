import { HttpBadGatewayError, HttpBadRequestError } from '$lib/errors';
import type { Encoded, SearchQuery, SearchResult } from '$lib/types';

function encode(query: Partial<SearchQuery>): Encoded<Partial<SearchQuery>> {
  const entries = Object.entries(query)
    .map(([key, value]) => {
      if (value == null || value === '') {
        return [key, ''];
      }

      if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) {
          return [key, ''];
        }

        const timestamp = Math.floor(value.getTime() / 1000);
        return [key, timestamp.toString()];
      }

      return [key, value.toString()];
    })
    .filter(([, value]) => value !== '');

  return Object.fromEntries(entries);
}

export async function search(
  query: Partial<SearchQuery>,
  signal?: AbortSignal
): Promise<SearchResult> {
  // TODO: Don't search when query is empty
  const params = new URLSearchParams(encode(query));
  const url = `https://api.nostr.wine/search?${params}`;
  console.debug(url, query);

  const res = await fetch(url, { signal });
  const data = await res.json();

  if (!res.ok) {
    if (res.status < 500) {
      throw new HttpBadRequestError(JSON.stringify(data.error));
    } else {
      throw new HttpBadGatewayError(JSON.stringify(data.error));
    }
  }

  return data;
}
