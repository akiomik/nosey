import type { RequestEvent } from '@sveltejs/kit';
import { search } from '$lib/helpers/search';

export async function load({ url }: RequestEvent) {
  const q = url.searchParams.get('q');
  if (!q) {
    return;
  }

  const pageString = url.searchParams.get('page') ?? '0';
  let page = Number.parseInt(pageString, 10);
  if (Number.isNaN(page)) {
    page = 0;
  }

  const result = await search({
    query: q,
    kind: 1,
    limit: 100,
    sort: 'time',
    page: page + 1,
  });
  return { q, page, result };
}
