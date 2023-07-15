import { error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';
import { search } from '$lib/helpers/search';
import { parseQuery } from '$lib/helpers/parseQuery';
import { HttpBadRequestError, HttpBadGatewayError } from '$lib/errors';

export async function load({ url }: RequestEvent) {
  const q = url.searchParams.get('q')?.trim();
  if (!q) {
    return;
  }

  const pageString = url.searchParams.get('page') ?? '0';
  let page = Number.parseInt(pageString, 10);
  if (Number.isNaN(page)) {
    page = 0;
  }

  try {
    const result = await search({
      ...parseQuery(q),
      kind: 1,
      limit: 100,
      sort: 'time',
      page: page + 1,
    });

    return { q, page, result };
  } catch (e) {
    // TODO: Improve error message

    if (e instanceof HttpBadRequestError) {
      throw error(400, JSON.parse(e.message));
    }

    if (e instanceof HttpBadGatewayError) {
      console.error('HttpBadGatewayError', url, e);
      throw error(502, JSON.parse(e.message));
    }

    console.error('Unknown Error', url, e);
    throw e;
  }
}
