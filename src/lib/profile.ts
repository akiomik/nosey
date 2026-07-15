import { z } from 'zod';
import { zostr } from 'zod-nostr';

const ProfileMetadataStringSchema = z.string().trim().min(1).catch('');

export const NostrProfileMetadataSchema = z.object({
  name: ProfileMetadataStringSchema,
  display_name: ProfileMetadataStringSchema,
  picture: ProfileMetadataStringSchema,
  nip05: zostr.nip05.identifier().catch(''),
});

export type NostrProfileMetadata = z.output<typeof NostrProfileMetadataSchema>;

// zostr.nip01.metadata() is intentionally strict. Search results may contain
// partial profile metadata, so retain this UI-specific fallback behavior here.
export const NostrProfileContentSchema = z
  .string()
  .transform((content, ctx) => {
    try {
      return JSON.parse(content);
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Invalid Nostr profile content' });
      return z.NEVER;
    }
  })
  .pipe(NostrProfileMetadataSchema);
