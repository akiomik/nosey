import type * as Nostr from 'nostr-typedef';
import { z } from 'zod';
import { zostr } from 'zod-nostr';

// zostr.event() rejects unknown keys, but the search API decorates each event
// with response-specific fields (a relevance `score`, for one). Rebuilding it
// as a plain z.object keeps zod-nostr's field validation while stripping those
// extras instead of failing the whole response.
const NostrEventSchema = z.object(zostr.event().shape);

// The trailing transform rebuilds the event because signature verification
// stamps a cache symbol onto the object it checks.
export const VerifiedNostrEventSchema = NostrEventSchema.check(zostr.signatureCheck()).transform(
  ({ id, pubkey, created_at, kind, tags, content, sig }) => ({
    id,
    pubkey,
    created_at,
    kind,
    tags,
    content,
    sig,
  })
);

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
  data: z.array(VerifiedNostrEventSchema).max(100),
  pagination: SearchResultPaginationSchema,
});

export type SearchResultPagination = z.output<typeof SearchResultPaginationSchema>;
export type SearchResult = Omit<z.output<typeof SearchResultSchema>, 'data'> & {
  data: Nostr.Event[];
};
