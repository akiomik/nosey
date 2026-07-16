import { z } from 'zod';
import { zostr } from 'zod-nostr';
import { resolveIdentifiedProfile } from './profile';

export const MentionItemSchema = z
  .object({
    pubkey: zostr.pubkey(),
    content: z.string(),
  })
  .transform(({ pubkey, content }) => resolveIdentifiedProfile(pubkey, content));

export type MentionItem = z.output<typeof MentionItemSchema>;
