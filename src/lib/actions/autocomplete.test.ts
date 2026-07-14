import { fireEvent } from '@testing-library/svelte';
import {
  type EventTemplate,
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  nip19,
} from 'nostr-tools';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WS from 'vitest-websocket-mock';
import { autocomplete } from './autocomplete.svelte';

const RELAY_URLS: [string, string] = ['wss://search.nos.today', 'wss://relay.nostr.band'];

const respondWithRawContent = async (relays: WS[], content: string) => {
  const sk = generateSecretKey();
  const pubkey = getPublicKey(sk);
  const template: EventTemplate = {
    kind: 0,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content,
  };
  const event = finalizeEvent(template, sk);

  for (const relay of relays) {
    await relay.connected;
    const raw = await relay.nextMessage;
    const [, subId] = JSON.parse(raw as string);
    relay.send(JSON.stringify(['EVENT', subId, event]));
    relay.send(JSON.stringify(['EOSE', subId]));
  }

  return { pubkey, event };
};

const respondWithProfile = (relays: WS[], content: Record<string, unknown>) =>
  respondWithRawContent(relays, JSON.stringify(content));

// Sends `count` distinct-pubkey kind:0 events to a single relay in response to
// the one REQ it's expected to receive, then closes the subscription.
const respondWithProfiles = async (relay: WS, count: number) => {
  await relay.connected;
  const raw = await relay.nextMessage;
  const [, subId] = JSON.parse(raw as string);

  const pubkeys: string[] = [];
  for (let i = 0; i < count; i++) {
    const sk = generateSecretKey();
    const pubkey = getPublicKey(sk);
    pubkeys.push(pubkey);
    const template: EventTemplate = {
      kind: 0,
      created_at: Math.floor(Date.now() / 1000),
      tags: [],
      content: JSON.stringify({ name: `user-${i}` }),
    };
    const event = finalizeEvent(template, sk);
    relay.send(JSON.stringify(['EVENT', subId, event]));
  }
  relay.send(JSON.stringify(['EOSE', subId]));

  return pubkeys;
};

const getMenuContent = () =>
  document.body.querySelector('[data-scope="popover"][data-part="content"]');

afterEach(() => {
  document.body.innerHTML = '';
  WS.clean();
});

describe('autocomplete', () => {
  it('opens a menu with search results, renders them safely, and Enter replaces only the trigger text', async () => {
    const relays = RELAY_URLS.map((url) => new WS(url));

    const input = document.createElement('input');
    document.body.appendChild(input);
    const action = autocomplete(input, { relays: RELAY_URLS, prefix: 'from:' });

    input.value = 'hello from:@bob world';
    const caret = 'hello from:@bob'.length;
    input.setSelectionRange(caret, caret);
    await fireEvent.input(input);

    const { pubkey } = await respondWithProfile(relays, {
      name: '<img src=x onerror=alert(1)>',
      picture: '',
      nip05: '',
    });

    await vi.waitFor(() => {
      expect(getMenuContent()).not.toHaveAttribute('hidden');
      expect(getMenuContent()?.querySelector('button')).not.toBeNull();
    });

    // The malicious name must show up as inert text, never as a parsed element/attribute.
    const content = getMenuContent();
    expect(content?.querySelector('img[onerror]')).toBeNull();
    expect(content?.textContent).toContain('<img src=x onerror=alert(1)>');

    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(input.value).toBe(`hello from:${nip19.npubEncode(pubkey)} world`);
    expect(getMenuContent()).toHaveAttribute('hidden');

    action?.destroy();
  }, 15000);

  it('closes the menu on Escape without changing the input value', async () => {
    for (const url of RELAY_URLS) {
      new WS(url);
    }

    const input = document.createElement('input');
    document.body.appendChild(input);
    const action = autocomplete(input, { relays: RELAY_URLS, prefix: 'from:' });

    input.value = 'from:@bob';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);

    await vi.waitFor(() => {
      expect(getMenuContent()).not.toHaveAttribute('hidden');
    });

    await fireEvent.keyDown(input, { key: 'Escape' });

    expect(getMenuContent()).toHaveAttribute('hidden');
    expect(input.value).toBe('from:@bob');

    action?.destroy();
  });

  it('recovers from a profile event with invalid JSON content instead of getting stuck loading', async () => {
    const relays = RELAY_URLS.map((url) => new WS(url));

    const input = document.createElement('input');
    document.body.appendChild(input);
    const action = autocomplete(input, { relays: RELAY_URLS, prefix: 'from:' });

    input.value = 'from:@bob';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);

    const { pubkey } = await respondWithRawContent(relays, '{not valid json');

    await vi.waitFor(() => {
      expect(getMenuContent()).not.toHaveAttribute('hidden');
      expect(getMenuContent()?.textContent).not.toContain('Searching...');
    });

    // Falls back to the raw pubkey as the display name instead of throwing and
    // leaving the menu stuck on "Searching...".
    expect(getMenuContent()?.textContent).toContain(pubkey);

    action?.destroy();
  }, 15000);

  it('caps merged results from multiple relays at 10 items', async () => {
    const relays = RELAY_URLS.map((url) => new WS(url));

    const input = document.createElement('input');
    document.body.appendChild(input);
    const action = autocomplete(input, { relays: RELAY_URLS, prefix: 'from:' });

    input.value = 'from:@bob';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);

    await Promise.all(relays.map((relay) => respondWithProfiles(relay, 6)));

    await vi.waitFor(() => {
      expect(getMenuContent()?.querySelectorAll('button').length).toBe(10);
    });

    action?.destroy();
  }, 15000);

  it('shows only the newest event when relays return different versions of the same profile', async () => {
    const [relayA, relayB] = RELAY_URLS.map((url) => new WS(url)) as [WS, WS];

    const input = document.createElement('input');
    document.body.appendChild(input);
    const action = autocomplete(input, { relays: RELAY_URLS, prefix: 'from:' });

    input.value = 'from:@bob';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);

    const sk = generateSecretKey();
    const now = Math.floor(Date.now() / 1000);
    const oldEvent = finalizeEvent(
      { kind: 0, created_at: now - 100, tags: [], content: JSON.stringify({ name: 'bob-old' }) },
      sk
    );
    const newEvent = finalizeEvent(
      { kind: 0, created_at: now, tags: [], content: JSON.stringify({ name: 'bob-new' }) },
      sk
    );

    // One relay only has the stale copy of the profile, the other has the
    // freshly updated one -- both are valid results for the same pubkey.
    for (const [relay, event] of [
      [relayA, oldEvent],
      [relayB, newEvent],
    ] as const) {
      await relay.connected;
      const raw = await relay.nextMessage;
      const [, subId] = JSON.parse(raw as string);
      relay.send(JSON.stringify(['EVENT', subId, event]));
      relay.send(JSON.stringify(['EOSE', subId]));
    }

    await vi.waitFor(() => {
      expect(getMenuContent()).not.toHaveAttribute('hidden');
      expect(getMenuContent()?.querySelector('button')).not.toBeNull();
    });

    const buttons = getMenuContent()?.querySelectorAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons?.[0]?.textContent).toContain('bob-new');

    action?.destroy();
  }, 15000);

  it('debounces input so only the final query reaches the relay', async () => {
    const [relayUrl] = RELAY_URLS;
    const relay = new WS(relayUrl);

    const input = document.createElement('input');
    document.body.appendChild(input);
    const action = autocomplete(input, { relays: [relayUrl], prefix: 'from:' });

    input.value = 'from:@b';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);

    // Type the rest before the debounce timer fires; the first keystroke's
    // search must never reach the relay.
    await new Promise((resolve) => setTimeout(resolve, 50));

    input.value = 'from:@bob';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);

    await relay.connected;
    const raw = await relay.nextMessage;
    const [type, subId, filter] = JSON.parse(raw as string);
    expect(type).toBe('REQ');
    expect(filter.search).toBe('bob');

    relay.send(JSON.stringify(['EOSE', subId]));

    await vi.waitFor(() => {
      const reqMessages = relay.messages.filter((m) => JSON.parse(m as string)[0] === 'REQ');
      expect(reqMessages).toHaveLength(1);
    });

    action?.destroy();
  }, 15000);
});
