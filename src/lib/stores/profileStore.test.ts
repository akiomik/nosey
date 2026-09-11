import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { type EventTemplate, finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';
import { get } from 'svelte/store';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import WS from 'vitest-websocket-mock';
import { profileStore } from './profileStore';

// `vitest-websocket-mock` only mocks the WebSocket side. rx-nostr separately
// fetches each relay's NIP-11 document over plain HTTPS and blocks the REQ on
// the answer, so without msw the tests reach the real relays and hang for as
// long as those hosts take to reply -- see issue #406.
//
// The handlers name the three documents rx-nostr asks for and answer with an
// empty one, which leaves `limitation.max_subscriptions` undefined -- how
// rx-nostr treats a relay serving no NIP-11 anyway. They document the traffic
// rather than hold it back: `onUnhandledRequest: 'error'` is what keeps a
// request off the network, and `fetchRelayInfo` turns any failure into that
// same empty document. So a relay added to `profileStore.ts` without a handler
// here stays offline and fast, just undocumented.
const server = setupServer(
  ...['https://relay.damus.io/', 'https://nos.lol/', 'https://yabu.me/'].map((url) =>
    http.get(url, () => HttpResponse.json({}))
  )
);

// msw also intercepts WebSocket, replacing jsdom's accessor with a read-only
// data property that mock-socket (behind `vitest-websocket-mock`) then fails
// to assign over. Only HTTP interception is wanted here, so take a copy of the
// descriptor msw is about to overwrite and put it back once msw has started.
// Restoring the accessor itself, rather than a stand-in, leaves mock-socket
// assigning through the same setter it uses when msw is not involved.
const nativeWebSocket = Object.getOwnPropertyDescriptor(globalThis, 'WebSocket');
if (!nativeWebSocket) {
  throw new Error('expected the test environment to define a WebSocket global');
}

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  Object.defineProperty(globalThis, 'WebSocket', nativeWebSocket);
});
afterAll(() => server.close());

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
  });

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
  });
});
