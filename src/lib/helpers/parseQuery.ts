import { nip19 } from 'nostr-tools';
import type { SearchQuery } from '$lib/types';

const filters = ['since', 'until', 'from'];

export function parseQuery(query: string): Partial<SearchQuery> {
  const result: Partial<SearchQuery> = {};

  for (const keyword of query.split(' ')) {
    const [filter = '', ...parameters] = keyword.split(':');
    const parameter = parameters.join(':');

    if (filters.includes(filter) && parameter !== '') {
      switch (filter) {
        case 'since':
          result.since = new Date(parameter);
          continue;
        case 'until':
          result.until = new Date(parameter);
          continue;
        case 'from':
          try {
            const { data } = nip19.decode(parameter);
            result.pubkey = data as string;
          } catch {
            // NOTE: ignore invalid pubkey
          }
          continue;
        default:
          throw new Error('unexpected');
      }
    }

    result.query = result.query ? `${result.query} ${keyword}` : keyword;
  }

  return result;
}
