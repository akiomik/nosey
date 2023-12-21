import { createRxNostr, createRxOneshotReq, filterBy, verify, latestEach } from 'rx-nostr';
import { readable, type Readable } from 'svelte/store';
import { map, toArray } from 'rxjs';
import type * as Nostr from 'nostr-typedef';
import { browser } from '$app/environment';

export const profileStore = (pubkeys: string[]): Readable<Record<string, Nostr.Event>> => {
  if (!browser) {
    return readable({});
  }

  return readable({}, (set) => {
    const rxNostr = createRxNostr();
    rxNostr.switchRelays(['wss://relay.damus.io', 'wss://nos.lol', 'wss://yabu.me']).then(() => {
      const req = createRxOneshotReq({
        filters: [{ kinds: [0], authors: pubkeys, limit: pubkeys.length }],
      });

      const sub = rxNostr.use(req).pipe(
        filterBy({ kinds: [0], authors: pubkeys }),
        verify(),
        latestEach(({ event }) => event.pubkey),
        map(({ event }) => event),
        toArray()
      );

      sub.subscribe((events) => {
        const entries = events.map((event) => [event.pubkey, event]);
        set(Object.fromEntries(entries));
      });
    });

    return () => rxNostr.dispose();
  });
};
