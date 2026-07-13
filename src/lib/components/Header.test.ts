import { fireEvent, render } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';
import WS from 'vitest-websocket-mock';
import Header from './Header.svelte';

// AdvancedSearchModal (nested inside the hamburger menu's Dialog) mounts its
// `use:autocomplete` input as soon as it's in the DOM, which opens a
// WebSocket connection to these relays regardless of whether the dialog is
// actually open. Mock them so the connection attempt doesn't leak out.
afterEach(() => {
  WS.clean();
});

describe('Header', () => {
  it('opens the hamburger Popover, and opening the nested Advanced Search Dialog closes it', async () => {
    new WS('wss://search.nos.today');
    new WS('wss://relay.nostr.band');

    const { container } = render(Header);

    const popoverTrigger = container.querySelector(
      '[data-scope="popover"][data-part="trigger"]'
    ) as HTMLElement;
    const popoverContent = document.querySelector(
      '[data-scope="popover"][data-part="content"]'
    ) as HTMLElement;
    const dialogContent = document.querySelector(
      '[data-scope="dialog"][data-part="content"]'
    ) as HTMLElement;

    expect(popoverContent).toHaveAttribute('hidden');
    expect(dialogContent).toHaveAttribute('hidden');

    await fireEvent.click(popoverTrigger);
    expect(popoverContent).not.toHaveAttribute('hidden');

    const dialogTrigger = document.querySelector(
      '[data-scope="dialog"][data-part="trigger"]'
    ) as HTMLElement;
    await fireEvent.click(dialogTrigger);

    expect(dialogContent).not.toHaveAttribute('hidden');
    expect(popoverContent).toHaveAttribute('hidden');
  });
});
