import type { SearchResult } from '$lib/search/result';

export type { SearchResult, SearchResultPagination } from '$lib/search/result';

export type PageData = {
  q: string;
  page: number;
  result: SearchResult;
};

export type Profile = Partial<{
  display_name: string;
  name: string;
}>;

export type MentionItem = {
  pubkey: string;
  content: string;
  name: string;
  picture: string;
  nip05: string;
};
