import { z } from 'zod';
import { isoDateCodec, SearchFiltersSchema } from './filters';
import { npubCodec } from './nostr';

const emptyString = z.literal('');

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
