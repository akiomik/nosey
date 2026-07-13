import { type EventTemplate, finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';
import { get } from 'svelte/store';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WS from 'vitest-websocket-mock';
import { profileStore } from './profileStore';

afterEach(() => {
  WS.clean();
});

describe('profileStore', () => {
  it('subscribes to the default relays and records the latest kind:0 event per pubkey', async () => {
    const relays = [
      new WS('wss://relay.damus.io'),
      new WS('wss://nos.lol'),
      new WS('wss://yabu.me'),
    ];

    const sk = generateSecretKey();
    const pubkey = getPublicKey(sk);
    const template: EventTemplate = {
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: JSON.stringify({ name: 'Alice' }),
    };
    const event = finalizeEvent(template, sk);

    const store = profileStore([pubkey]);
    const unsubscribe = store.subscribe(() => {});

    for (const relay of relays) {
      await relay.connected;
      const raw = await relay.nextMessage;
      const [, subId] = JSON.parse(raw as string);
      relay.send(JSON.stringify(['EVENT', subId, event]));
      relay.send(JSON.stringify(['EOSE', subId]));
    }

    await vi.waitFor(() => {
      // rx-nostr's `verify()` operator tags the event with a non-enumerable
      // Symbol marker, so compare via toMatchObject rather than toEqual.
      expect(get(store)[pubkey]).toMatchObject(event);
    });

    unsubscribe();
  }, 15000);
});
