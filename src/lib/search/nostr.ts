import { nip19 } from 'nostr-tools';
import { verifyEvent } from 'nostr-tools/pure';
import { z } from 'zod';

export const PubkeySchema = z.hex().length(64).lowercase();

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
