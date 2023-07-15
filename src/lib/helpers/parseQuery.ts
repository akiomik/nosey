import type { SearchQuery } from '$lib/types';

const filters = ['since', 'until', 'from'];

export function parseQuery(query: string): Partial<SearchQuery> {
  return query.split(' ').reduce((acc: Partial<SearchQuery>, keyword: string) => {
    const [filter, ...parameters] = keyword.split(':');

    if (filters.includes(filter)) {
      const parameter = parameters.join(':');

      switch (filter) {
        case 'since':
          return { ...acc, since: new Date(parameter) };
        case 'until':
          return { ...acc, until: new Date(parameter) };
        case 'from':
          return { ...acc, pubkey: parameter };
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
