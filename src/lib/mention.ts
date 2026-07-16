import { z } from 'zod';
import { zostr } from 'zod-nostr';
import {
  NostrProfileContentSchema,
  NostrProfileMetadataSchema,
  resolveProfileDisplayName,
} from './profile';

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
      name: resolveProfileDisplayName(profile, pubkey),
      picture: profile.picture,
      nip05: zostr.nip05.formatIdentifier(profile.nip05),
    };
  });

export type MentionItem = z.output<typeof MentionItemSchema>;
