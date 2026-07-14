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

  it('ends up with the newest event when relays disagree on the profile version', async () => {
    const [relayA, relayB, relayC] = [
      new WS('wss://relay.damus.io'),
      new WS('wss://nos.lol'),
      new WS('wss://yabu.me'),
    ];

    const sk = generateSecretKey();
    const pubkey = getPublicKey(sk);
    const now = Math.floor(Date.now() / 1000);

    const oldEvent = finalizeEvent(
      { kind: 0, created_at: now - 100, tags: [], content: JSON.stringify({ name: 'old' }) },
      sk
    );
    const newEvent = finalizeEvent(
      { kind: 0, created_at: now, tags: [], content: JSON.stringify({ name: 'new' }) },
      sk
    );

    const store = profileStore([pubkey]);
    const unsubscribe = store.subscribe(() => {});

    // The first relay to answer holds the stale copy; the other two hold the
    // freshly updated one. Whichever relay wins the race must not matter.
    const relayEvents: [WS, typeof oldEvent][] = [
      [relayA, oldEvent],
      [relayB, newEvent],
      [relayC, newEvent],
    ];
    for (const [relay, event] of relayEvents) {
      await relay.connected;
      const raw = await relay.nextMessage;
      const [, subId] = JSON.parse(raw as string);
      relay.send(JSON.stringify(['EVENT', subId, event]));
      relay.send(JSON.stringify(['EOSE', subId]));
    }

    await vi.waitFor(() => {
      expect(get(store)[pubkey]?.content).toBe(newEvent.content);
    });

    unsubscribe();
  }, 15000);
});
