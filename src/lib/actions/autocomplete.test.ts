import { fireEvent } from '@testing-library/svelte';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import {
  type EventTemplate,
  finalizeEvent,
  generateSecretKey,
  getPublicKey,
  nip19,
} from 'nostr-tools';
import type * as Nostr from 'nostr-typedef';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { autocomplete } from './autocomplete.svelte';

const SEARCH_URL = 'https://api.nostr.wine/search';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  document.body.innerHTML = '';
});
afterAll(() => server.close());

const makeProfileEvent = (content: string, overrides: Partial<EventTemplate> = {}) => {
  const sk = generateSecretKey();
  const pubkey = getPublicKey(sk);
  const template: EventTemplate = {
    kind: 0,
    created_at: Math.floor(Date.now() / 1000),
    tags: [],
    content,
    ...overrides,
  };
  return { pubkey, event: finalizeEvent(template, sk) };
};

const mockSearchResult = (events: Nostr.Event[]) => {
  server.use(
    http.get(SEARCH_URL, () =>
      HttpResponse.json({
        data: events,
        pagination: {
          last_page: true,
          limit: 20,
          next_url: '',
          page: 0,
          total_pages: 1,
          total_records: events.length,
        },
      })
    )
  );
};

const mockSearchError = (status: number) => {
  server.use(http.get(SEARCH_URL, () => HttpResponse.json({ error: 'oops' }, { status })));
};

const getMenuContent = () =>
  document.body.querySelector('[data-scope="popover"][data-part="content"]');

describe('autocomplete', () => {
  it('opens a menu with search results, renders them safely, and Enter replaces only the trigger text', async () => {
    const { pubkey, event } = makeProfileEvent(
      JSON.stringify({ name: '<img src=x onerror=alert(1)>', picture: '', nip05: '' })
    );
    mockSearchResult([event]);

    const input = document.createElement('input');
    document.body.appendChild(input);
    const action = autocomplete(input, { prefix: 'from:' });

    input.value = 'hello from:@bob world';
    const caret = 'hello from:@bob'.length;
    input.setSelectionRange(caret, caret);
    await fireEvent.input(input);

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
  });

  it('closes the menu on Escape without changing the input value', async () => {
    const input = document.createElement('input');
    document.body.appendChild(input);
    const action = autocomplete(input, { prefix: 'from:' });

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
    const { pubkey, event } = makeProfileEvent('{not valid json');
    mockSearchResult([event]);

    const input = document.createElement('input');
    document.body.appendChild(input);
    const action = autocomplete(input, { prefix: 'from:' });

    input.value = 'from:@bob';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);

    await vi.waitFor(() => {
      expect(getMenuContent()).not.toHaveAttribute('hidden');
      expect(getMenuContent()?.textContent).not.toContain('Searching...');
    });

    // Falls back to the raw pubkey as the display name instead of throwing and
    // leaving the menu stuck on "Searching...".
    expect(getMenuContent()?.textContent).toContain(pubkey);

    action?.destroy();
  });

  it('recovers from a search API failure instead of getting stuck loading', async () => {
    mockSearchError(502);

    const input = document.createElement('input');
    document.body.appendChild(input);
    const action = autocomplete(input, { prefix: 'from:' });

    input.value = 'from:@bob';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);

    await vi.waitFor(() => {
      expect(getMenuContent()).not.toHaveAttribute('hidden');
      expect(getMenuContent()?.textContent).toContain('No matches found');
    });

    action?.destroy();
  });

  it('caps results at 10 items when the API returns more than the limit', async () => {
    const events = Array.from(
      { length: 12 },
      (_, i) => makeProfileEvent(JSON.stringify({ name: `user-${i}` })).event
    );
    mockSearchResult(events);

    const input = document.createElement('input');
    document.body.appendChild(input);
    const action = autocomplete(input, { prefix: 'from:' });

    input.value = 'from:@bob';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);

    await vi.waitFor(() => {
      expect(getMenuContent()?.querySelectorAll('button').length).toBe(10);
    });

    action?.destroy();
  });

  it('navigates results with arrow keys and Enter confirms the highlighted item', async () => {
    const first = makeProfileEvent(JSON.stringify({ name: 'first' }));
    const second = makeProfileEvent(JSON.stringify({ name: 'second' }));
    mockSearchResult([first.event, second.event]);

    const input = document.createElement('input');
    document.body.appendChild(input);
    const action = autocomplete(input, { prefix: 'from:' });

    input.value = 'from:@bo';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);

    await vi.waitFor(() => {
      expect(getMenuContent()?.querySelectorAll('button').length).toBe(2);
    });

    await fireEvent.keyDown(input, { key: 'ArrowDown' });
    await fireEvent.keyDown(input, { key: 'Enter' });

    expect(input.value).toBe(`from:${nip19.npubEncode(second.pubkey)}`);

    action?.destroy();
  });

  it('debounces input so only the final query reaches the API', async () => {
    const requestedQueries: string[] = [];
    server.use(
      http.get(SEARCH_URL, ({ request }) => {
        const url = new URL(request.url);
        requestedQueries.push(url.searchParams.get('query') ?? '');
        return HttpResponse.json({
          data: [],
          pagination: {
            last_page: true,
            limit: 20,
            next_url: '',
            page: 0,
            total_pages: 1,
            total_records: 0,
          },
        });
      })
    );

    const input = document.createElement('input');
    document.body.appendChild(input);
    const action = autocomplete(input, { prefix: 'from:' });

    input.value = 'from:@b';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);

    // Type the rest before the debounce timer fires; the first keystroke's
    // search must never reach the API.
    await new Promise((resolve) => setTimeout(resolve, 50));

    input.value = 'from:@bob';
    input.setSelectionRange(input.value.length, input.value.length);
    await fireEvent.input(input);

    await vi.waitFor(() => {
      expect(requestedQueries).toEqual(['bob']);
    });

    action?.destroy();
  });
});
