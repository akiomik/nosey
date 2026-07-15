import { nip19 } from 'nostr-tools';
import { verifyEvent } from 'nostr-tools/pure';
import { z } from 'zod';

export const PubkeySchema = z.hex().length(64).lowercase();

const NIP05_LOCAL_PART = /^[a-z0-9._-]+$/i;

export const Nip05IdentifierSchema = z.string().superRefine((identifier, ctx) => {
  const separator = identifier.indexOf('@');
  if (separator <= 0 || separator !== identifier.lastIndexOf('@')) {
    ctx.addIssue({ code: 'custom', message: 'Invalid NIP-05 identifier' });
    return;
  }

  const localPart = identifier.slice(0, separator);
  const domain = identifier.slice(separator + 1);
  if (!NIP05_LOCAL_PART.test(localPart)) {
    ctx.addIssue({ code: 'custom', message: 'Invalid NIP-05 local part' });
    return;
  }

  try {
    const url = new URL(`https://${domain}`);
    if (
      url.host.toLowerCase() !== domain.toLowerCase() ||
      url.pathname !== '/' ||
      url.search ||
      url.hash
    ) {
      throw new Error('Invalid NIP-05 domain');
    }
  } catch {
    ctx.addIssue({ code: 'custom', message: 'Invalid NIP-05 domain' });
  }
});

const ProfileMetadataStringSchema = z.string().trim().min(1).catch('');

export const NostrProfileMetadataSchema = z.object({
  name: ProfileMetadataStringSchema,
  display_name: ProfileMetadataStringSchema,
  picture: ProfileMetadataStringSchema,
  nip05: Nip05IdentifierSchema.catch(''),
});

export type NostrProfileMetadata = z.output<typeof NostrProfileMetadataSchema>;

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

export const formatNip05Identifier = (identifier: string): string =>
  identifier.startsWith('_@') ? identifier.slice(2) : identifier;

export const NpubSchema = z.string().superRefine((value, ctx) => {
  try {
    const decoded = nip19.decode(value);
    if (decoded.type === 'npub' && typeof decoded.data === 'string') {
      return;
    }
  } catch {
    // The issue below provides a stable validation error for malformed npubs.
  }

  ctx.addIssue({ code: 'custom', message: 'Invalid npub' });
});

export const npubCodec = z.codec(NpubSchema, PubkeySchema, {
  decode: (npub) => nip19.decode(npub).data as string,
  encode: (pubkey) => nip19.npubEncode(pubkey),
});

export const NostrEventSchema = z
  .object({
    id: z.hex().length(64).lowercase(),
    pubkey: PubkeySchema,
    created_at: z.number().int().nonnegative(),
    kind: z.number().int().nonnegative(),
    tags: z.array(z.array(z.string())),
    content: z.string(),
    sig: z.hex().length(128).lowercase(),
  })
  .superRefine((event, ctx) => {
    if (!verifyEvent({ ...event })) {
      ctx.addIssue({ code: 'custom', message: 'Invalid Nostr event signature' });
    }
  });
