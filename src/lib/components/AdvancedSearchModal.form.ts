import { z } from 'zod';
import { zostr } from 'zod-nostr';
import { isoDateCodec, SearchFiltersSchema } from '../search/filters';

const emptyString = z.literal('');
const npubCodec = zostr.npub();

const optionalNpub = z
  .string()
  .trim()
  .pipe(z.union([emptyString, npubCodec]));
const optionalIsoDate = z
  .string()
  .trim()
  .pipe(z.union([emptyString, isoDateCodec]));

export const AdvancedSearchFormSchema = z
  .object({
    keyword: z.string().trim(),
    from: optionalNpub,
    since: optionalIsoDate,
    until: optionalIsoDate,
  })
  .transform(({ keyword, from, since, until }) => ({
    ...(keyword === '' ? {} : { query: keyword }),
    ...(from === '' ? {} : { pubkey: from }),
    ...(since === '' ? {} : { since }),
    ...(until === '' ? {} : { until }),
  }))
  .pipe(SearchFiltersSchema);

export type AdvancedSearchFormData = z.input<typeof AdvancedSearchFormSchema>;
