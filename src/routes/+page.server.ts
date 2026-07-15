import type { RequestEvent } from '@sveltejs/kit';
import { error } from '@sveltejs/kit';
import { HttpBadGatewayError, HttpBadRequestError, HttpTooManyRequestsError } from '$lib/errors';
import { search } from '$lib/search/api';
import { hasSearchFilter } from '$lib/search/filters';
import { createNoteSearchRequest } from '$lib/search/request';
import { searchTextCodec } from '$lib/search/text';
import { SearchUrlSchema } from '$lib/search/url';

export async function load({ url }: RequestEvent) {
  const parsedUrl = SearchUrlSchema.safeParse({
    q: url.searchParams.get('q') ?? undefined,
    page: url.searchParams.get('page') ?? undefined,
  });
  if (!parsedUrl.success) {
    throw error(400, 'Invalid search URL');
  }

  const filters = parsedUrl.data.q;
  if (!filters || !hasSearchFilter(filters)) {
    return;
  }

  const page = parsedUrl.data.page ?? 0;
  const q = searchTextCodec.encode(filters);

  try {
    const result = await search(createNoteSearchRequest(filters, page));

    return { q, page, result };
  } catch (e) {
    // TODO: Improve error message

    if (e instanceof HttpTooManyRequestsError) {
      throw error(429, JSON.parse(e.message));
    }

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
