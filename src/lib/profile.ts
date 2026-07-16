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

export const resolveProfileDisplayName = (metadata: NostrProfileMetadata, fallback: string) =>
  metadata.name || metadata.display_name || fallback;

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

export const parseNostrProfileContent = (content: string): NostrProfileMetadata | undefined => {
  const parsed = NostrProfileContentSchema.safeParse(content);
  return parsed.success ? parsed.data : undefined;
};
