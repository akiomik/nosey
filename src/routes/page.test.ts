import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WS from 'vitest-websocket-mock';
import type { SearchResult } from '$lib/search/result';
import type { PageData } from '$lib/types';
import Page from './+page.svelte';

const goto = vi.fn();

vi.mock('$app/navigation', () => ({
  goto: (...args: unknown[]) => goto(...args),
}));

const emptyResult: SearchResult = {
  data: [],
  pagination: {
    last_page: true,
    limit: 20,
    next_url: '',
    page: 0,
    total_pages: 1,
    total_records: 0,
  },
};

const makeData = (q: string): PageData => ({ q, page: 0, result: emptyResult });

// The search input's `use:autocomplete` action and NoteList's `profileStore`
// both open relay WebSocket connections as soon as they're mounted,
// regardless of whether they're actually used in a given test.
afterEach(() => {
  WS.clean();
});

describe('+page.svelte', () => {
  // Regression test for a pre-existing bug (fixed in 62dfd6a): the search
  // form kept its own local copy of the query text (`query`), which was only
  // ever updated by typing into the input. Navigating to a different query
  // any other way (e.g. clicking the "from:@mattn" tip link, or paginating)
  // left `query` pointing at whatever was last typed/submitted, so
  // resubmitting the form afterwards silently searched for the stale query
  // instead of the one actually shown on screen.
  it('submits the query currently on screen, not a stale one left over from before navigating here', async () => {
    for (const url of [
      'wss://search.nos.today',
      'wss://relay.nostr.band',
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://yabu.me',
    ]) {
      new WS(url);
    }

    const { rerender, container } = render(Page, { props: { data: makeData('hoge') } });

    // Simulate navigating to a different query via a link (e.g. the
    // "from:@mattn" tip), which SvelteKit does by updating `data` on the
    // same mounted +page.svelte instance -- it does not remount it.
    await rerender({ data: makeData('from:npub1abc') });

    const submitButton = container.querySelector('button[type="submit"]') as HTMLElement;
    await fireEvent.click(submitButton);

    expect(goto).toHaveBeenCalledTimes(1);
    const [calledUrl] = goto.mock.calls[0] as [string];
    expect(new URLSearchParams(calledUrl.split('?')[1]).get('q')).toBe('from:npub1abc');
  });
});
