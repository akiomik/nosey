import type { SearchResult } from '$lib/search/result';

export type { SearchResult, SearchResultPagination } from '$lib/search/result';

export type PageData = {
  q: string;
  page: number;
  result: SearchResult;
};
