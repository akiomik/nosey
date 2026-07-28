import { z } from 'zod';
import { zostr } from 'zod-nostr';
import { shortenNostrId } from './nostr';

const { metadataFields } = zostr.nip01;

// zod-nostr's metadataFields atoms are strict and non-optional. Search results
// and note authors may carry partial or malformed profile metadata, so layer a
// display-oriented recovery policy on top: trim, drop empties, and fall back to
// '' instead of failing the whole profile.
const displayString = (schema: z.ZodString) => schema.trim().min(1).catch('');

export const ProfileSchema = z.object({
  name: displayString(metadataFields.name()),
  display_name: displayString(metadataFields.displayName()),
  picture: metadataFields.picture().catch(''),
  nip05: metadataFields.nip05().catch(''),
});

export type Profile = z.output<typeof ProfileSchema>;

// A profile tied to the pubkey it was fetched for, so display helpers can
// fall back to something derived from the pubkey without callers having to
// compute and pass that fallback themselves.
export type IdentifiedProfile = { pubkey: string; profile: Profile };

// Codec between a kind:0 `content` string (JSON) and the profile object.
// Invalid JSON, or JSON that isn't a profile object, surfaces as a Zod issue.
export const ProfileContentSchema = zostr.jsonCodec(ProfileSchema);

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
