import { verifier } from '@rx-nostr/crypto';
import type * as Nostr from 'nostr-typedef';
import { createRxNostr, createRxOneshotReq, filterBy, latestEach, verify } from 'rx-nostr';
import { map } from 'rxjs';
import { type Readable, readable } from 'svelte/store';
import { browser } from '$app/environment';

export const profileStore = (pubkeys: string[]): Readable<Record<string, Nostr.Event>> => {
  if (!browser) {
    return readable({});
  }

  return readable({}, (_, update) => {
    const rxNostr = createRxNostr({ verifier });
    rxNostr.setDefaultRelays(['wss://relay.damus.io', 'wss://nos.lol', 'wss://yabu.me']);

    const req = createRxOneshotReq({
      filters: [{ kinds: [0], authors: pubkeys, limit: pubkeys.length }],
    });

    const sub = rxNostr.use(req).pipe(
      filterBy({ kinds: [0], authors: pubkeys }),
      verify(verifier),
      latestEach(({ event }) => event.pubkey),
      map(({ event }) => event)
    );

    sub.subscribe((event) => {
      // `latestEach` only re-emits a pubkey once a strictly newer event for it
      // has arrived (ties and older events are filtered upstream), so every
      // emission here is safe to write straight through -- skipping it when
      // the pubkey is already present would freeze the store on whichever
      // relay answered first, even if a slower relay held a newer profile.
      update(($profileMap: Record<string, Nostr.Event>) => ({
        ...$profileMap,
        [event.pubkey]: event,
      }));
    });

    return () => rxNostr.dispose();
  });
};
