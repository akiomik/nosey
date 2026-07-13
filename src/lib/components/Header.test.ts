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
  it('opens the hamburger Menu, and selecting the Advanced Search item opens the Dialog and closes the Menu', async () => {
    new WS('wss://search.nos.today');
    new WS('wss://relay.nostr.band');

    const { container } = render(Header);

    const menuTrigger = container.querySelector(
      '[data-scope="menu"][data-part="trigger"]'
    ) as HTMLElement;
    const menuContent = document.querySelector(
      '[data-scope="menu"][data-part="content"]'
    ) as HTMLElement;
    const dialogContent = document.querySelector(
      '[data-scope="dialog"][data-part="content"]'
    ) as HTMLElement;

    expect(menuContent).toHaveAttribute('hidden');
    expect(dialogContent).toHaveAttribute('hidden');

    await fireEvent.click(menuTrigger);
    expect(menuContent).not.toHaveAttribute('hidden');

    const advancedSearchItem = document.querySelector(
      '[data-scope="menu"][data-part="item"][data-value="advanced-search"]'
    ) as HTMLElement;
    await fireEvent.click(advancedSearchItem);

    expect(dialogContent).not.toHaveAttribute('hidden');
    expect(menuContent).toHaveAttribute('hidden');
  });
});
