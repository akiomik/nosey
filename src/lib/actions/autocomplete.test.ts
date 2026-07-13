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

const RELAY_URLS = ['wss://search.nos.today', 'wss://relay.nostr.band'];

const respondWithProfile = async (relays: WS[], content: Record<string, unknown>) => {
  const sk = generateSecretKey();
  const pubkey = getPublicKey(sk);
  const template: EventTemplate = {
    kind: 0,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content: JSON.stringify(content),
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
});
