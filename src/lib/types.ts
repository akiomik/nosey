import type { SearchResult } from '#lib/search/result.ts';

export type { SearchResult, SearchResultPagination } from '#lib/search/result.ts';

export type PageData = {
  q: string;
  page: number;
  result: SearchResult;
};
