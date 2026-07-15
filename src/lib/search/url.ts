import { z } from 'zod';
import { searchTextCodec } from './text';

const nonNegativeInteger = z
  .string()
  .trim()
  .min(1)
  .transform(Number)
  .pipe(z.number().int().nonnegative());

export const SearchUrlSchema = z.object({
  q: searchTextCodec.optional(),
  page: nonNegativeInteger.optional(),
});

export type SearchUrl = z.output<typeof SearchUrlSchema>;
