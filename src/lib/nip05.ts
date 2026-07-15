import { zostr } from 'zod-nostr';
import { browser } from '$app/environment';

const VERIFY_TIMEOUT_MS = 5_000;

const cache = new Map<string, Promise<boolean>>();

// Exported so callers (e.g. Nip05Badge) can show which domain a check was
// performed against without duplicating the "no `@`" => domain-root fallback.
export const splitIdentifier = (identifier: string): { localPart: string; domain: string } => {
  const at = identifier.lastIndexOf('@');
  return at === -1
    ? { localPart: '_', domain: identifier }
    : { localPart: identifier.slice(0, at), domain: identifier.slice(at + 1) };
};

async function fetchAndVerify(pubkey: string, identifier: string): Promise<boolean> {
  const { localPart, domain } = splitIdentifier(identifier);

  try {
    const url = `https://${domain}/.well-known/nostr.json?name=${encodeURIComponent(localPart)}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(VERIFY_TIMEOUT_MS) });
    if (!response.ok) {
      return false;
    }

    const parsed = zostr.nip05.nostrJsonDocument().safeParse(await response.json());
    if (!parsed.success) {
      return false;
    }

    const resolvedPubkey = parsed.data.names[localPart];
    return resolvedPubkey?.toLowerCase() === pubkey.toLowerCase();
  } catch {
    return false;
  }
}

// Verifies that `identifier`'s domain vouches for `pubkey` per NIP-05, by
// fetching and checking its `.well-known/nostr.json`. Callers may pass either
// the raw profile identifier or the display form with a leading `_@`
// stripped (see `zostr.nip05.formatIdentifier`) -- both resolve to the same
// local part here. Results are cached per pubkey+identifier for the life of
// the page so the same profile showing up repeatedly (mention suggestions,
// search results) only triggers one fetch per domain.
export function verifyNip05(pubkey: string, identifier: string): Promise<boolean> {
  if (!browser) {
    return Promise.resolve(false);
  }

  const key = `${pubkey}:${identifier}`;
  let cached = cache.get(key);
  if (!cached) {
    cached = fetchAndVerify(pubkey, identifier);
    cache.set(key, cached);
  }

  return cached;
}
