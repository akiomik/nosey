import { z } from 'zod';
import { PubkeySchema } from './nostr';

export const isoDateCodec = z.codec(z.iso.date(), z.date(), {
  decode: (date) => new Date(`${date}T00:00:00.000Z`),
  encode: (date) => date.toISOString().slice(0, 10),
});

export const SearchFiltersSchema = z
  .object({
    query: z.string().trim().min(1).optional(),
    pubkey: PubkeySchema.optional(),
    since: z.date().optional(),
    until: z.date().optional(),
  })
  .superRefine(({ since, until }, ctx) => {
    if (since && until && since > until) {
      ctx.addIssue({
        code: 'custom',
        path: ['until'],
        message: 'until must be on or after since',
      });
    }
  });

export type SearchFilters = z.output<typeof SearchFiltersSchema>;

export const hasSearchFilter = (filters: SearchFilters): boolean =>
  filters.query !== undefined ||
  filters.pubkey !== undefined ||
  filters.since !== undefined ||
  filters.until !== undefined;
