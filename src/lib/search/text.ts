import { z } from 'zod';
import { zostr } from 'zod-nostr';
import { isoDateCodec, type SearchFilters, SearchFiltersSchema } from './filters';

const npubCodec = zostr.npub();

const knownFilters = new Set(['from', 'since', 'until']);

const addIssue = (
  ctx: z.core.ParsePayload<unknown>,
  path: PropertyKey[],
  message: string,
  input: unknown
) => {
  ctx.issues.push({ code: 'custom', path, message, input });
};

const decodeSearchText = (
  value: string,
  ctx: z.core.ParsePayload<unknown>
): SearchFilters | typeof z.NEVER => {
  const result: SearchFilters = {};
  const keywords: string[] = [];

  for (const word of value.trim().split(/\s+/)) {
    if (word === '') {
      continue;
    }

    const separator = word.indexOf(':');
    const filter = separator === -1 ? '' : word.slice(0, separator);
    const parameter = separator === -1 ? '' : word.slice(separator + 1);

    if (!knownFilters.has(filter) || parameter === '') {
      keywords.push(word);
      continue;
    }

    switch (filter) {
      case 'from': {
        const pubkey = npubCodec.safeDecode(parameter);
        if (!pubkey.success) {
          addIssue(ctx, ['from'], 'from must contain a valid npub', parameter);
          return z.NEVER;
        }
        result.pubkey = pubkey.data;
        break;
      }
      case 'since': {
        const since = isoDateCodec.safeDecode(parameter);
        if (!since.success) {
          addIssue(ctx, ['since'], 'since must be an ISO date', parameter);
          return z.NEVER;
        }
        result.since = since.data;
        break;
      }
      case 'until': {
        const until = isoDateCodec.safeDecode(parameter);
        if (!until.success) {
          addIssue(ctx, ['until'], 'until must be an ISO date', parameter);
          return z.NEVER;
        }
        result.until = until.data;
        break;
      }
    }
  }

  const query = keywords.join(' ').trim();
  if (query) {
    result.query = query;
  }

  return result;
};

const encodeSearchText = (filters: SearchFilters): string =>
  [
    filters.query,
    filters.pubkey && `from:${npubCodec.encode(filters.pubkey)}`,
    filters.since && `since:${isoDateCodec.encode(filters.since)}`,
    filters.until && `until:${isoDateCodec.encode(filters.until)}`,
  ]
    .filter((part): part is string => part !== undefined)
    .join(' ');

export const searchTextCodec = z.codec(z.string(), SearchFiltersSchema, {
  decode: decodeSearchText,
  encode: encodeSearchText,
});
