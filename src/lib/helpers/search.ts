import type { SearchQuery, SearchResult, Encoded } from '$lib/types';

function encode<A>(query: Partial<A>): Encoded<Partial<A>> {
  const entries = Object.entries(query).map(([key, value]) => [key, value?.toString()]);
  return Object.fromEntries(entries);
}

export async function search(query: Partial<SearchQuery>): Promise<SearchResult> {
  // TODO: Don't search when query is empty
  const params = new URLSearchParams(encode(query));
  const url = `https://api.nostr.wine/search?${params}`;
  console.debug(url);

  const res = await fetch(url);
  const data = await res.json();

  if (!res.ok) {
    // TODO: Improve error message
    throw new Error(JSON.stringify(data.error));
  }

  return data;
}
