import type { RequestEvent } from '@sveltejs/kit';
import { search } from '$lib/helpers/search';

export async function load({ url }: RequestEvent) {
  const q = url.searchParams.get('q');
  if (!q) {
    return;
  }

  const result = await search({ query: q, kind: 1, limit: 100, sort: 'time' });
  return { q, result };
}
