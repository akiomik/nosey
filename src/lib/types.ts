import { z } from 'zod';
import { zostr } from 'zod-nostr';
import { NostrProfileContentSchema, NostrProfileMetadataSchema } from '$lib/profile';
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
    pubkey: zostr.pubkey(),
    content: z.string(),
  })
  .transform(({ pubkey, content }) => {
    const profile = NostrProfileContentWithFallbackSchema.parse(content);

    return {
      pubkey,
      content,
      name: profile.name || profile.display_name || pubkey,
      picture: profile.picture,
      nip05: zostr.nip05.formatIdentifier(profile.nip05),
    };
  });

export type MentionItem = z.output<typeof MentionItemSchema>;
