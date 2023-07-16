import { nip19 } from 'nostr-tools';
import type { SearchQuery } from '$lib/types';

const filters = ['since', 'until', 'from'];

export function parseQuery(query: string): Partial<SearchQuery> {
  return query.split(' ').reduce((acc: Partial<SearchQuery>, keyword: string) => {
    const [filter, ...parameters] = keyword.split(':');

    const parameter = parameters.join(':');
    if (filters.includes(filter) && parameter !== '') {
      switch (filter) {
        case 'since':
          return { ...acc, since: new Date(parameter) };
        case 'until':
          return { ...acc, until: new Date(parameter) };
        case 'from': {
          const { data } = nip19.decode(parameter);
          return { ...acc, pubkey: data as string };
        }
        default:
          throw new Error('unexpected');
      }
    }

    if (acc.query) {
      return { ...acc, query: `${acc.query} ${keyword}` };
    }

    return { ...acc, query: keyword };
  }, {} as Partial<SearchQuery>);
}
