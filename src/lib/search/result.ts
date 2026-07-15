import type * as Nostr from 'nostr-typedef';
import { z } from 'zod';
import { NostrEventSchema } from './nostr';

export const SearchResultPaginationSchema = z.object({
  last_page: z.boolean(),
  limit: z.number().int().nonnegative(),
  next_url: z.string().nullable(),
  page: z.number().int().nonnegative(),
  total_pages: z.number().int().nonnegative(),
  total_records: z.number().int().nonnegative(),
});

export const SearchResultSchema = z.object({
  // Requests are capped at 100 results, so cap verification work to the same bound.
  data: z.array(NostrEventSchema).max(100),
  pagination: SearchResultPaginationSchema,
});

export type SearchResultPagination = z.output<typeof SearchResultPaginationSchema>;
export type SearchResult = Omit<z.output<typeof SearchResultSchema>, 'data'> & {
  data: Nostr.Event[];
};
