import { z } from 'zod';
import { zostr } from 'zod-nostr';
import { shortenNostrId } from './nostr';

const ProfileMetadataStringSchema = z.string().trim().min(1).catch('');

export const ProfileSchema = z.object({
  name: ProfileMetadataStringSchema,
  display_name: ProfileMetadataStringSchema,
  picture: ProfileMetadataStringSchema,
  nip05: zostr.nip05.identifier().catch(''),
});

export type Profile = z.output<typeof ProfileSchema>;

// A profile tied to the pubkey it was fetched for, so display helpers can
// fall back to something derived from the pubkey without callers having to
// compute and pass that fallback themselves.
export type IdentifiedProfile = { pubkey: string; profile: Profile };

// zostr.nip01.metadata() is intentionally strict. Search results and note
// authors may carry partial or malformed profile metadata, so retain this
// UI-specific fallback behavior here.
export const ProfileContentSchema = z
  .string()
  .transform((content, ctx) => {
    try {
      return JSON.parse(content);
    } catch {
      ctx.addIssue({ code: 'custom', message: 'Invalid Nostr profile content' });
      return z.NEVER;
    }
  })
  .pipe(ProfileSchema);

const emptyProfile = ProfileSchema.parse({});
const ProfileContentWithFallbackSchema = ProfileContentSchema.catch(emptyProfile);

// Always returns a usable IdentifiedProfile, even when `content` is missing,
// unparseable, or only partially valid.
export const resolveIdentifiedProfile = (pubkey: string, content?: string): IdentifiedProfile => ({
  pubkey,
  profile: content ? ProfileContentWithFallbackSchema.parse(content) : emptyProfile,
});

export const resolveDisplayName = ({ pubkey, profile }: IdentifiedProfile): string =>
  profile.name || profile.display_name || shortenNostrId(pubkey);

export const resolveNip05Display = ({ profile }: IdentifiedProfile): string =>
  zostr.nip05.formatIdentifier(profile.nip05);
