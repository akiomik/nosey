import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { type EventTemplate, finalizeEvent, generateSecretKey, getPublicKey } from 'nostr-tools';
import { get } from 'svelte/store';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import WS from 'vitest-websocket-mock';
import { profileStore } from './profileStore';

// `vitest-websocket-mock` only mocks the WebSocket side. rx-nostr separately
// fetches each relay's NIP-11 document over plain HTTPS and blocks the REQ on
// the answer, so without these handlers the tests reach the real relays and
// hang for as long as those hosts take to reply -- see issue #406. An empty
// document leaves `limitation.max_subscriptions` undefined, which is how
// rx-nostr behaves against a relay that serves no NIP-11 anyway.
const server = setupServer(
  ...['https://relay.damus.io/', 'https://nos.lol/', 'https://yabu.me/'].map((url) =>
    http.get(url, () => HttpResponse.json({}))
  )
);

// `error` keeps any request this file does not stub from reaching the network.
// rx-nostr swallows a failed NIP-11 fetch, so adding a relay without a handler
// stays green rather than erroring -- but it stays offline and fast, which is
// what matters here.
// msw also intercepts WebSocket, installing a read-only global that
// mock-socket (behind `vitest-websocket-mock`) then fails to overwrite. Only
// HTTP interception is wanted here, so capture the constructor msw is about to
// replace and put it back -- writable this time -- once msw has started.
const NativeWebSocket = globalThis.WebSocket;

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  Object.defineProperty(globalThis, 'WebSocket', {
    value: NativeWebSocket,
    writable: true,
    enumerable: true,
    configurable: true,
  });
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
