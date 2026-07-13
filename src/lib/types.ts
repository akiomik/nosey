import type * as Nostr from 'nostr-typedef';

export type SearchQuery = {
  query: string;
  kind: number;
  pubkey: string;
  since: Date;
  until: Date;
  sort: 'time' | 'relevance';
  limit: number;
  page: number;
};

export type SearchResultPagination = {
  last_page: boolean;
  limit: number;
  next_url: string;
  page: number;
  total_pages: number;
  total_records: number;
};

export type SearchResult = {
  data: Nostr.Event[];
  pagination: SearchResultPagination;
};

export type Encoded<A extends object> = {
  [key in keyof A]: string;
};

export type PageData = {
  q: string;
  page: number;
  result: SearchResult;
};

export type Profile = Partial<{
  display_name: string;
  name: string;
}>;

export type AdvancedSearchFormData = {
  keyword: string;
  from: string;
  since: string;
  until: string;
};

export type MentionItem = {
  pubkey: string;
  content: string;
  name: string;
  picture: string;
  nip05: string;
};
