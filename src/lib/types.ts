import { z } from 'zod';
import {
  formatNip05Identifier,
  NostrProfileContentSchema,
  NostrProfileMetadataSchema,
  PubkeySchema,
} from '$lib/search/nostr';
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

const NostrProfileContentWithFallbackSchema = NostrProfileContentSchema.catch(
  NostrProfileMetadataSchema.parse({})
);

export const MentionItemSchema = z
  .object({
    pubkey: PubkeySchema,
    content: z.string(),
  })
  .transform(({ pubkey, content }) => {
    const profile = NostrProfileContentWithFallbackSchema.parse(content);

    return {
      pubkey,
      content,
      name: profile.name || profile.display_name || pubkey,
      picture: profile.picture,
      nip05: formatNip05Identifier(profile.nip05),
    };
  });

export type MentionItem = z.output<typeof MentionItemSchema>;
